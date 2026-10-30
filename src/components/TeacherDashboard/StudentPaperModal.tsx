import React from 'react';
import { StudentSubmission, QuizQuestion } from '../../types/quiz';
import { X, CheckCircle2, XCircle, Clock, Calendar, Award } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface StudentPaperModalProps {
  submission: StudentSubmission | null;
  questions: QuizQuestion[];
  onClose: () => void;
}

export const StudentPaperModal: React.FC<StudentPaperModalProps> = ({
  submission,
  questions,
  onClose,
}) => {
  if (!submission) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              👦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-jua text-xl">
                  {submission.studentName} 학생의 응답 시험지
                </h3>
                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full font-bold">
                  {submission.studentClass || '3학년'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-amber-100 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  소요: {submission.timeSpentSeconds || 60}초
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  제출: {formatDate(submission.submittedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-amber-200">점수</span>
              <div className="font-jua text-2xl leading-none">
                {submission.score}<span className="text-sm">점</span>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-900">
              전체 10문항 중 <strong className="text-emerald-700">{submission.correctCount}문항</strong> 정답 ({submission.score}점)
            </span>
            <span className="text-xs font-bold text-amber-700 bg-white px-2.5 py-1 rounded-full border border-amber-300">
              {submission.score === 100 ? '🎖️ 만점 마스터' : submission.score >= 80 ? '👏 우수' : '🌱 발전 필요'}
            </span>
          </div>

          {questions.map((q) => {
            const chosenOpt = submission.answers[q.id];
            const isCorrect = chosenOpt === q.correctIndex;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border-2 ${
                  isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-jua px-2 py-0.5 rounded-md ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      문항 {q.id}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">[{q.category}]</span>
                    <span className="font-jua text-sm text-gray-900">{q.title}</span>
                  </div>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> 정답
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600">
                      <XCircle className="w-4 h-4" /> 오답
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-2.5 leading-relaxed bg-white/70 p-2 rounded-lg">
                  {q.scenario}
                </p>

                <div className="space-y-1 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isStudent = chosenOpt === optIdx;
                    const isRight = q.correctIndex === optIdx;

                    let rowStyle = 'text-gray-700 bg-white border-gray-100';
                    if (isRight) rowStyle = 'bg-emerald-100 text-emerald-900 font-bold border-emerald-300';
                    else if (isStudent && !isRight) rowStyle = 'bg-rose-100 text-rose-900 font-bold border-rose-300';

                    return (
                      <div
                        key={optIdx}
                        className={`p-2 rounded-lg border flex items-center justify-between ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                            {optIdx + 1}
                          </span>
                          <span>{opt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isStudent && (
                            <span className="text-[10px] bg-orange-200 text-orange-900 px-1 rounded-sm">
                              학생 선택
                            </span>
                          )}
                          {isRight && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1 rounded-sm">
                              정답
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/80">
                  <strong>💡 지도 포인트:</strong> {q.teachingPoint}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
