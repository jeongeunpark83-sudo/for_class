export type QuizCategory = '초상권' | '개인정보 보호' | '온라인 예절' | '미디어 다짐';

export interface QuizQuestion {
  id: number;
  category: QuizCategory;
  title: string;
  scenario: string;
  situationEmoji: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tipForStudent: string;
  teachingPoint: string; // 교사를 위한 지도 중점
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass?: string; // 예: "3학년 2반"
  answers: Record<number, number>; // { questionId: selectedIndex }
  score: number; // 0 ~ 100
  correctCount: number; // 0 ~ 10
  totalQuestions: number; // 10
  submittedAt: string; // ISO date string
  timeSpentSeconds?: number;
}

export interface QuizStatsSummary {
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number; // 80점 이상 비율
  hardestQuestionId: number | null;
  questionStats: {
    questionId: number;
    category: QuizCategory;
    title: string;
    correctRate: number; // 0 ~ 100%
    optionCounts: number[]; // [countOpt0, countOpt1, countOpt2, countOpt3]
  }[];
}
