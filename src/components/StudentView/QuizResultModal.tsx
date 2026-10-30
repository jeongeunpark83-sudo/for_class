import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizQuestion, StudentSubmission } from '../../types/quiz';
import { sounds } from '../../utils/soundEffects';
import { Award, CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp, Printer, Sparkles, Heart } from 'lucide-react';

interface QuizResultModalProps {
  submission: StudentSubmission;
  questions: QuizQuestion[];
  onRetry: () => void;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({
  submission,
  questions,
  onRetry,
}) => {
  const [filterWrongOnly, setFilterWrongOnly] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Trigger celebratory sound
    sounds.playCelebration();

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);
    } catch {
      // ignore
    }
  }, []);

  const toggleExpand = (qId: number) => {
    sounds.playClick();
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const isPerfect = submission.score === 100;
  const isGood = submission.score >= 80;

  const filteredQuestions = filterWrongOnly
    ? questions.filter((q) => submission.answers[q.id] !== q.correctIndex)
    : questions;

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Printable Certificate Card */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50/40 rounded-3xl p-6 sm:p-10 shadow-xl border-4 border-amber-300 relative overflow-hidden mb-8 text-center print:shadow-none print:border-2">
        <div className="absolute top-4 left-6 text-3xl select-none animate-float">🎉</div>
        <div className="absolute top-4 right-6 text-3xl select-none animate-float" style={{ animationDelay: '1s' }}>🌟</div>

        {/* Certificate Badge */}
        <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white font-jua text-sm px-4 py-1 rounded-full shadow-xs mb-3">
          <Award className="w-4 h-4" />
          <span>미디어 지킴이 임명장</span>
        </div>

        <h2 className="font-jua text-3xl sm:text-4xl text-amber-950 mb-2">
          참 잘했어요! 미디어 지킴이 마스터
        </h2>

        <p className="text-sm sm:text-base text-amber-800 font-medium mb-6">
          위 학생은 초등학교 3학년 국어 매체 퀴즈에 적극적으로 참여하여 <br className="hidden sm:inline" />
          올바른 디지털 매체 지킴이로서의 역량을 훌륭히 증명하였습니다.
        </p>

        {/* Student Name Box */}
        <div className="inline-block bg-white px-8 py-3 rounded-2xl border-2 border-amber-200 shadow-sm mb-6">
          <div className="text-xs text-amber-700 font-bold mb-0.5">
            {submission.studentClass || '3학년'}
          </div>
          <div className="font-jua text-2xl sm:text-3xl text-orange-600">
            {submission.studentName} 어린이
          </div>
        </div>

        {/* Score Display Card */}
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xs rounded-2xl p-5 border-2 border-amber-200 shadow-xs mb-6 grid grid-cols-3 gap-3">
          <div className="text-center border-r border-amber-100">
            <div className="text-xs text-amber-700 font-medium">최종 점수</div>
            <div className="font-jua text-3xl text-amber-900 mt-1">
              {submission.score}<span className="text-base text-amber-600">점</span>
            </div>
          </div>
          <div className="text-center border-r border-amber-100">
            <div className="text-xs text-amber-700 font-medium">맞힌 문제</div>
            <div className="font-jua text-3xl text-emerald-600 mt-1">
              {submission.correctCount}<span className="text-base text-gray-500">/{submission.totalQuestions}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-amber-700 font-medium">소요 시간</div>
            <div className="font-jua text-3xl text-blue-600 mt-1">
              {submission.timeSpentSeconds || 60}<span className="text-base text-gray-500">초</span>
            </div>
          </div>
        </div>

        {/* Encouraging Mascot Message */}
        <div className="bg-white/80 rounded-2xl p-4 border border-amber-200 max-w-lg mx-auto flex items-center gap-3 text-left">
          <div className="text-3xl shrink-0">🐿️</div>
          <div className="text-xs sm:text-sm text-amber-900">
            {isPerfect && (
              <span><strong>만점이에요! 완벽해요!</strong> 친구들의 초상권과 내 소중한 개인정보를 똑소리 나게 지키는 최고 지킴이예요! 💯</span>
            )}
            {!isPerfect && isGood && (
              <span><strong>아주 훌륭해요!</strong> 조금 헷갈린 문제도 아래 풀이를 읽어보면 금방 마스터할 수 있어요! 👏</span>
            )}
            {!isPerfect && !isGood && (
              <span><strong>수고 많았어요!</strong> 문제를 다시 천천히 읽어보고 아래 해설을 확인하면 다음엔 100점 맞을 수 있어요! 힘내요! 💪</span>
            )}
          </div>
        </div>

        {/* Print / Save button */}
        <div className="mt-6 flex items-center justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-900 font-jua text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-700" />
            <span>임명장 인쇄 / 저장</span>
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-jua text-sm rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새로 풀기</span>
          </button>
        </div>
      </div>

      {/* Item-by-Item Review Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-amber-100">
          <div>
            <h3 className="font-jua text-2xl text-amber-950 flex items-center gap-2">
              <span>💡 문제별 정답과 쏙쏙 풀이</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              내가 고른 답과 올바른 정답, 그리고 토리의 친절한 설명을 확인해 보세요!
            </p>
          </div>

          {/* Filter toggle */}
          {submission.correctCount < submission.totalQuestions && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterWrongOnly(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-jua transition-colors cursor-pointer ${
                  !filterWrongOnly
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                전체 문제 ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterWrongOnly(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-jua transition-colors cursor-pointer ${
                  filterWrongOnly
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
              >
                틀린 문제만 ({submission.totalQuestions - submission.correctCount})
              </button>
            </div>
          )}
        </div>

        {/* Question Review Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const studentChoice = submission.answers[q.id];
            const isCorrect = studentChoice === q.correctIndex;
            const isExpanded = expandedQuestions[q.id] !== false; // default open

            return (
              <div
                key={q.id}
                className={`rounded-2xl border-2 transition-all p-5 ${
                  isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                {/* Header line */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`font-jua text-sm px-2.5 py-0.5 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      문제 {q.id}
                    </span>
                    <span className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                      {q.category}
                    </span>
                    <h4 className="font-jua text-base sm:text-lg text-gray-900">
                      {q.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>정답!</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>다시 확인</span>
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                    <p className="text-xs sm:text-sm text-gray-700 bg-white/80 p-3 rounded-xl border border-gray-100 leading-relaxed">
                      <strong>상황:</strong> {q.scenario}
                    </p>

                    {/* Options list showing student selection & correct answer */}
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {q.options.map((opt, optIdx) => {
                        const isStudentPick = studentChoice === optIdx;
                        const isRightAnswer = q.correctIndex === optIdx;

                        let style = 'bg-white border-gray-200 text-gray-700';
                        if (isRightAnswer) {
                          style = 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-950';
                        } else if (isStudentPick && !isRightAnswer) {
                          style = 'bg-rose-100/80 border-rose-400 font-bold text-rose-950 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0">
                                {optIdx + 1}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {isStudentPick && (
                                <span className="text-[11px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md font-bold">
                                  내가 고른 답
                                </span>
                              )}
                              {isRightAnswer && (
                                <span className="text-[11px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">
                                  정답
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="bg-amber-50/90 rounded-2xl p-3.5 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
                      <div className="font-jua text-amber-900 mb-1 flex items-center gap-1.5">
                        <span>💡 쏙쏙 해설:</span>
                      </div>
                      <p>{q.explanation}</p>
                      <div className="mt-2 pt-2 border-t border-amber-200/60 font-medium text-orange-800 flex items-center gap-1">
                        <span>🐿️</span>
                        <span>{q.tipForStudent}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
