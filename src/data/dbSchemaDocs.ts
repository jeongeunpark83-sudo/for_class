export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- 1. 3학년 국어 매체 퀴즈 학생 응답 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(50) NOT NULL,            -- 학생 이름 (예: 김민우)
    student_class VARCHAR(50) DEFAULT '3학년',     -- 학급/번호 (예: 3학년 2반 5번)
    answers JSONB NOT NULL,                       -- 학생이 고른 문항별 보기 { "1": 1, "2": 2, ... }
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100), -- 100점 만점 점수
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0 AND correct_count <= 10), -- 맞힌 문제 수
    total_questions INTEGER DEFAULT 10,           -- 전체 문제 수
    time_spent_seconds INTEGER DEFAULT 0,         -- 소요 시간(초)
    created_at TIMESTAMPTZ DEFAULT NOW()          -- 제출 일시
);

-- 인덱스 생성 (시간순 조회 및 성적 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at 
ON quiz_submissions (created_at DESC);

-- ==========================================
-- 2. 행 수준 보안 (Row Level Security, RLS) 설정
-- ==========================================
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- 학생: 로그인 없이 누구나 자신의 응답 INSERT 가능 (익명 제출)
CREATE POLICY "누구나 퀴즈 제출 가능" 
ON quiz_submissions 
FOR INSERT 
WITH CHECK (true);

-- 교사/대시보드: 누구나 실시간 응답 조회 가능
CREATE POLICY "누구나 응답 목록 조회 가능" 
ON quiz_submissions 
FOR SELECT 
USING (true);

-- ==========================================
-- 3. 실시간 변경사항 알림 (Supabase Realtime) 활성화
-- ==========================================
-- Supabase 대시보드 Database > Publications > supabase_realtime에 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_submissions;
`;

export const FIREBASE_FIRESTORE_STRUCTURE = `{
  "collection": "quiz_submissions",
  "documentId": "자동생성 (Auto-ID, 예: sub_1730000000)",
  "documentFields": {
    "studentName": "김민우 (string)",
    "studentClass": "3학년 2반 (string)",
    "answers": {
      "1": 1,
      "2": 2,
      "3": 1,
      "4": 1,
      "5": 1,
      "6": 1,
      "7": 1,
      "8": 1,
      "9": 2,
      "10": 2
    },
    "score": 100,
    "correctCount": 10,
    "totalQuestions": 10,
    "timeSpentSeconds": 140,
    "submittedAt": "2026-10-30T01:00:00.000Z (timestamp/string)"
  }
}`;

export const FIREBASE_SECURITY_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quiz_submissions/{submissionId} {
      // 학생: 별도 로그인 없이도 퀴즈 응답 문서 생성 허용
      allow create: if request.resource.data.studentName is string 
                    && request.resource.data.studentName.size() > 0
                    && request.resource.data.score is int
                    && request.resource.data.score >= 0 
                    && request.resource.data.score <= 100;
                    
      // 교사 대시보드: 실시간 데이터 읽기 허용
      allow read: if true;
      
      // 수정 및 삭제는 관리자만 허용하거나 제한
      allow update, delete: if false;
    }
  }
}`;

export const INTEGRATION_GUIDE = {
  supabase: [
    '1. Supabase(https://supabase.com)에 로그인 후 새 프로젝트를 생성합니다.',
    '2. 왼쪽 메뉴의 [SQL Editor]를 클릭하고 위 "Supabase SQL 스키마"를 복사하여 붙여넣은 뒤 [RUN]을 누릅니다.',
    '3. [Project Settings] > [API]에서 Project URL과 anon public key를 확인합니다.',
    '4. 대시보드의 [Database] > [Replication]에서 "quiz_submissions" 테이블이 Source로 활성화되어 있는지 확인합니다.'
  ],
  firebase: [
    '1. Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 생성합니다.',
    '2. [Firestore Database]를 만들고 규칙 탭에 위 "Firestore 보안 규칙"을 적용합니다.',
    '3. [프로젝트 설정] > [일반] > [내 앱]에서 웹 앱을 추가하고 발급된 firebaseConfig를 확인합니다.',
    '4. 프론트엔드에서 onSnapshot(collection(db, "quiz_submissions")) 리스너를 등록하면 실시간 동기화가 동작합니다.'
  ]
};
