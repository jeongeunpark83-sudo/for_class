import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Interface for student submission
interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass?: string;
  answers: Record<number, number>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  timeSpentSeconds?: number;
}

// Data storage file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load persisted submissions or start empty
let submissions: StudentSubmission[] = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    submissions = JSON.parse(raw);
    console.log(`[Server] Loaded ${submissions.length} existing submissions from file.`);
  }
} catch (e) {
  console.warn('[Server] Could not parse existing submissions.json, starting fresh.', e);
  submissions = [];
}

function saveSubmissionsToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to write to submissions.json:', err);
  }
}

// Server-Sent Events (SSE) clients for real-time live synchronization
const sseClients = new Set<Response>();

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive ping for SSE connections every 25 seconds
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

// --- REST API ROUTES ---

// 1. SSE Real-time Stream endpoint for Teacher Dashboard
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);
  console.log(`[SSE] Client connected. Total active clients: ${sseClients.size}`);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', totalCount: submissions.length })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[SSE] Client disconnected. Remaining clients: ${sseClients.size}`);
  });
});

// 2. GET all submissions
app.get('/api/submissions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: submissions.length,
    submissions: submissions.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
  });
});

// 3. POST new student submission
app.post('/api/submissions', (req: Request, res: Response) => {
  const { studentName, studentClass, answers, score, correctCount, totalQuestions, timeSpentSeconds } = req.body;

  if (!studentName || typeof studentName !== 'string' || studentName.trim() === '') {
    res.status(400).json({ success: false, error: '학생 이름을 입력해 주세요.' });
    return;
  }

  const newSubmission: StudentSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    studentName: studentName.trim().slice(0, 30),
    studentClass: typeof studentClass === 'string' ? studentClass.trim().slice(0, 30) : '3학년',
    answers: answers || {},
    score: typeof score === 'number' ? score : 0,
    correctCount: typeof correctCount === 'number' ? correctCount : 0,
    totalQuestions: typeof totalQuestions === 'number' ? totalQuestions : 10,
    submittedAt: new Date().toISOString(),
    timeSpentSeconds: typeof timeSpentSeconds === 'number' ? timeSpentSeconds : 0,
  };

  submissions.push(newSubmission);
  saveSubmissionsToFile();

  // Broadcast to all connected Teacher Dashboards in real time!
  broadcastSSE('NEW_SUBMISSION', newSubmission);
  console.log(`[Submission] Received from: ${newSubmission.studentName} (${newSubmission.score}점). Broadcast sent to ${sseClients.size} listeners.`);

  res.status(201).json({
    success: true,
    submission: newSubmission,
  });
});

// 4. DELETE / reset submissions (for teacher to start a new quiz session)
app.delete('/api/submissions', (_req: Request, res: Response) => {
  submissions = [];
  saveSubmissionsToFile();
  broadcastSSE('RESET_SUBMISSIONS', { count: 0 });
  res.json({ success: true, message: '모든 응답 데이터가 초기화되었습니다.' });
});

// 5. POST /api/seed - for teacher to populate mock student data for demo
app.post('/api/seed', (_req: Request, res: Response) => {
  const sampleStudents = [
    { name: '김민준', class: '3학년 1반', score: 100, correct: 10, time: 145 },
    { name: '이서아', class: '3학년 1반', score: 90, correct: 9, time: 180 },
    { name: '박도윤', class: '3학년 1반', score: 80, correct: 8, time: 210 },
    { name: '정하은', class: '3학년 1반', score: 100, correct: 10, time: 130 },
    { name: '최지우', class: '3학년 1반', score: 70, correct: 7, time: 240 },
  ];

  const correctAnswers: Record<number, number> = {
    1: 1, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2, 10: 2
  };

  const now = Date.now();
  const created: StudentSubmission[] = [];

  sampleStudents.forEach((student, idx) => {
    // Generate answers with slight variations
    const answers: Record<number, number> = {};
    for (let q = 1; q <= 10; q++) {
      if (q <= student.correct) {
        answers[q] = correctAnswers[q];
      } else {
        // pick a distractor
        answers[q] = (correctAnswers[q] + 1) % 4;
      }
    }

    const sub: StudentSubmission = {
      id: `seed_${now}_${idx}`,
      studentName: student.name,
      studentClass: student.class,
      answers,
      score: student.score,
      correctCount: student.correct,
      totalQuestions: 10,
      submittedAt: new Date(now - (sampleStudents.length - idx) * 45000).toISOString(),
      timeSpentSeconds: student.time,
    };
    submissions.push(sub);
    created.push(sub);
  });

  saveSubmissionsToFile();
  broadcastSSE('BATCH_SUBMISSIONS', { submissions: created });

  res.json({ success: true, count: created.length });
});

// 6. GET /api/health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    totalSubmissions: submissions.length,
    activeSSEClients: sseClients.size,
    time: new Date().toISOString(),
  });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static assets from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Educational Quiz App running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
