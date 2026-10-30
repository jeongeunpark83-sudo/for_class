import { StudentSubmission } from '../types/quiz';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  submissions?: StudentSubmission[];
}

export const api = {
  // Fetch all current submissions
  async getSubmissions(): Promise<StudentSubmission[]> {
    try {
      const res = await fetch('/api/submissions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.submissions || [];
    } catch (err) {
      console.error('[API] getSubmissions failed:', err);
      // Local fallback for offline mode
      const cached = localStorage.getItem('local_submissions_backup');
      return cached ? JSON.parse(cached) : [];
    }
  },

  // Submit student answers to central backend
  async submitQuiz(payload: {
    studentName: string;
    studentClass?: string;
    answers: Record<number, number>;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds?: number;
  }): Promise<StudentSubmission> {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      return result.submission;
    } catch (err: any) {
      console.warn('[API] Submit failed, falling back to local fallback buffer:', err);
      // Create a fallback local record so student never loses their completion
      const fallback: StudentSubmission = {
        id: `offline_${Date.now()}`,
        studentName: payload.studentName,
        studentClass: payload.studentClass || '3학년',
        answers: payload.answers,
        score: payload.score,
        correctCount: payload.correctCount,
        totalQuestions: payload.totalQuestions,
        submittedAt: new Date().toISOString(),
        timeSpentSeconds: payload.timeSpentSeconds,
      };

      const existing = JSON.parse(localStorage.getItem('local_submissions_backup') || '[]');
      existing.push(fallback);
      localStorage.setItem('local_submissions_backup', JSON.stringify(existing));

      return fallback;
    }
  },

  // Reset all submissions (Teacher only)
  async resetSubmissions(): Promise<boolean> {
    try {
      const res = await fetch('/api/submissions', { method: 'DELETE' });
      localStorage.removeItem('local_submissions_backup');
      return res.ok;
    } catch {
      return false;
    }
  },

  // Seed sample student submissions (Teacher demo)
  async seedSubmissions(): Promise<boolean> {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Connect to Real-time Server-Sent Events (SSE)
  subscribeToLiveEvents(
    onNewSubmission: (submission: StudentSubmission) => void,
    onReset: () => void,
    onBatch: (submissions: StudentSubmission[]) => void,
    onConnectionChange: (connected: boolean) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;

      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          onConnectionChange(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'NEW_SUBMISSION' && parsed.data) {
              onNewSubmission(parsed.data);
            } else if (parsed.type === 'RESET_SUBMISSIONS') {
              onReset();
            } else if (parsed.type === 'BATCH_SUBMISSIONS' && parsed.data?.submissions) {
              onBatch(parsed.data.submissions);
            }
          } catch {
            // ping or non-json message
          }
        };

        eventSource.onerror = () => {
          onConnectionChange(false);
          eventSource?.close();
          eventSource = null;

          if (!isDisposed) {
            // Reconnect after 3 seconds
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
        onConnectionChange(false);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    // Return cleanup unsubscribe function
    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      onConnectionChange(false);
    };
  },
};
