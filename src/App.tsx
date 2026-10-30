import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudentEntry } from './components/StudentView/StudentEntry';
import { QuizCard } from './components/StudentView/QuizCard';
import { QuizResultModal } from './components/StudentView/QuizResultModal';
import { TeacherDashboard } from './components/TeacherDashboard/TeacherDashboard';
import { QUIZ_QUESTIONS } from './data/quizQuestions';
import { StudentSubmission } from './types/quiz';
import { api } from './services/api';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'teacher'>('student');
  const [studentPhase, setStudentPhase] = useState<'entry' | 'quiz' | 'result'>('entry');
  const [currentStudentName, setCurrentStudentName] = useState('');
  const [currentStudentClass, setCurrentStudentClass] = useState('3학년 1반');
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teacher submissions state & Real-time SSE
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [latestSubmissionAlert, setLatestSubmissionAlert] = useState<StudentSubmission | null>(null);

  // Check URL params for initial view (e.g. ?view=teacher)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'teacher') {
      setCurrentView('teacher');
    }
  }, []);

  // Fetch initial submissions
  const loadSubmissions = async () => {
    const data = await api.getSubmissions();
    setSubmissions(data);
  };

  useEffect(() => {
    loadSubmissions();

    // Subscribe to Real-Time SSE stream
    const unsubscribe = api.subscribeToLiveEvents(
      (newSub) => {
        setSubmissions((prev) => {
          // Avoid duplicate by id
          if (prev.some((s) => s.id === newSub.id)) return prev;
          return [newSub, ...prev];
        });
        setLatestSubmissionAlert(newSub);

        // Sound alert if currently on teacher view
        sounds.playClick();

        // Clear toast after 6 seconds
        setTimeout(() => {
          setLatestSubmissionAlert((curr) => (curr?.id === newSub.id ? null : curr));
        }, 6000);
      },
      () => {
        // On reset
        setSubmissions([]);
        setLatestSubmissionAlert(null);
      },
      (batch) => {
        setSubmissions(batch);
      },
      (connected) => {
        setIsLiveConnected(connected);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Student Starts Quiz
  const handleStartQuiz = (name: string, studentClass: string) => {
    setCurrentStudentName(name);
    setCurrentStudentClass(studentClass);
    setStudentPhase('quiz');
  };

  // Student Submits Quiz
  const handleSubmitQuiz = async (
    answers: Record<number, number>,
    timeSpentSeconds: number
  ) => {
    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);

    const submission = await api.submitQuiz({
      studentName: currentStudentName,
      studentClass: currentStudentClass,
      answers,
      score,
      correctCount,
      totalQuestions: QUIZ_QUESTIONS.length,
      timeSpentSeconds,
    });

    setCurrentSubmission(submission);
    setIsSubmitting(false);
    setStudentPhase('result');
  };

  // Student Retries or next student
  const handleRetryQuiz = () => {
    sounds.playClick();
    setCurrentSubmission(null);
    setStudentPhase('entry');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-gray-800 flex flex-col font-sans selection:bg-orange-200">
      {/* Global Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          // If switching to student view and completed, let them see their paper or restart
        }}
        isLiveConnected={isLiveConnected}
        activeCount={submissions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'student' ? (
          <div>
            {studentPhase === 'entry' && (
              <StudentEntry onStart={handleStartQuiz} />
            )}

            {studentPhase === 'quiz' && (
              <QuizCard
                questions={QUIZ_QUESTIONS}
                studentName={currentStudentName}
                studentClass={currentStudentClass}
                onSubmit={handleSubmitQuiz}
                isSubmitting={isSubmitting}
              />
            )}

            {studentPhase === 'result' && currentSubmission && (
              <QuizResultModal
                submission={currentSubmission}
                questions={QUIZ_QUESTIONS}
                onRetry={handleRetryQuiz}
              />
            )}
          </div>
        ) : (
          <TeacherDashboard
            submissions={submissions}
            questions={QUIZ_QUESTIONS}
            isLiveConnected={isLiveConnected}
            onRefresh={loadSubmissions}
            latestSubmissionAlert={latestSubmissionAlert}
          />
        )}
      </main>

      {/* Cute Footer */}
      <footer className="mt-auto py-6 border-t border-amber-200/60 bg-white/70 text-center text-xs text-amber-800/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1 font-medium">
            <span>🐿️</span>
            <span>초등학교 3학년 국어 매체 단원 · 초상권 & 개인정보 보호 & 온라인 글쓰기 퀴즈</span>
          </p>
          <p className="text-gray-500">
            실시간 다기기 동기화 엔진 지원 (스마트폰 · 태블릿 · PC)
          </p>
        </div>
      </footer>
    </div>
  );
}
