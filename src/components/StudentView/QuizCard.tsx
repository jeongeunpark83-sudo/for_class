import React, { useState } from 'react';
import { QuizQuestion } from '../../types/quiz';
import { sounds } from '../../utils/soundEffects';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface QuizCardProps {
  questions: QuizQuestion[];
  studentName: string;
  studentClass: string;
  onSubmit: (answers: Record<number, number>, timeSpent: number) => void;
  isSubmitting: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  questions,
  studentName,
  studentClass,
  onSubmit,
  isSubmitting,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startTime] = useState<number>(Date.now());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const currentAnswer = answers[currentQ.id];

  const handleSelectOption = (optIdx: number) => {
    sounds.playOptionSelect();
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      sounds.playNext();
      setCurrentIndex(currentIndex + 1);
    } else {
      sounds.playClick();
      setShowConfirmModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sounds.playClick();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onSubmit(answers, timeSpent);
  };

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  // Category badge colors
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '초상권':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '개인정보 보호':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case '온라인 예절':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Student Banner & Progress */}
      <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg">
              👦
            </span>
            <div>
              <span className="font-jua text-base sm:text-lg text-amber-950">
                {studentName} 어린이
              </span>
              <span className="text-xs text-amber-700 ml-2 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {studentClass || '3학년'}
              </span>
            </div>
          </div>
          <div className="font-jua text-sm sm:text-base text-amber-800 bg-amber-100/70 px-3 py-1 rounded-2xl">
            풀은 문제: <strong className="text-orange-600">{answeredCount}</strong> / {total}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative w-full bg-amber-100 h-4 rounded-full overflow-hidden border border-amber-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Question Dots */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-amber-100 overflow-x-auto gap-1">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => {
                  sounds.playClick();
                  setCurrentIndex(idx);
                }}
                className={`w-7 h-7 rounded-full text-xs font-jua transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-orange-500 text-white ring-2 ring-orange-300 scale-110 shadow-xs'
                    : isAnswered
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
                title={`문제 ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-200 relative">
        {/* Header pill */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-jua text-lg text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              문제 {currentIndex + 1}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryBadgeClass(
                currentQ.category
              )}`}
            >
              {currentQ.category}
            </span>
          </div>
          <span className="text-2xl" title="상황 이모지">
            {currentQ.situationEmoji}
          </span>
        </div>

        {/* Question Title */}
        <h3 className="font-jua text-xl sm:text-2xl text-amber-950 mb-3 leading-snug">
          {currentQ.title}
        </h3>

        {/* Situation Scenario Box */}
        <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 border-2 border-amber-100 mb-6 text-amber-900 text-sm sm:text-base leading-relaxed">
          <p className="font-medium">{currentQ.scenario}</p>
        </div>

        {/* 4 Interactive Options */}
        <div className="space-y-3 mb-6">
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = currentAnswer === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer active:scale-99 ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-200'
                    : 'bg-white hover:bg-amber-50/60 border-amber-200 hover:border-amber-300 shadow-xs'
                }`}
              >
                {/* Number Circle Badge */}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-jua text-sm shrink-0 transition-colors mt-0.5 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {optIdx + 1}
                </span>

                <span
                  className={`text-sm sm:text-base leading-snug ${
                    isSelected ? 'font-bold text-orange-950' : 'text-gray-800'
                  }`}
                >
                  {optionText}
                </span>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-orange-500 ml-auto shrink-0 mt-0.5 animate-bounce-gentle" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-amber-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-4 py-2.5 rounded-2xl font-jua text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>이전 문제</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex === total - 1 ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowConfirmModal(true);
                }}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-jua text-base sm:text-lg shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <Send className="w-5 h-5" />
                <span>{isSubmitting ? '제출 중...' : '답안 제출하기! 🚀'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-jua text-sm sm:text-base shadow-md shadow-amber-200 flex items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
              >
                <span>다음 문제</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-amber-300 text-center relative">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-3xl mb-4">
              🐿️
            </div>
            <h3 className="font-jua text-2xl text-amber-950 mb-2">
              답안을 제출할까요?
            </h3>

            {answeredCount < total ? (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 mb-5 text-left">
                <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>아직 풀지 않은 문제가 있어요!</span>
                </div>
                <p className="text-xs text-orange-800 leading-relaxed">
                  전체 10문제 중 <strong>{total - answeredCount}문제</strong>가 아직 선택되지 않았어요. 그래도 제출하시겠어요?
                </p>
              </div>
            ) : (
              <p className="text-sm text-amber-800 mb-6">
                10문제를 모두 풀었어요! 멋져요 🎉<br />
                제출하면 바로 점수와 풀이를 확인할 수 있어요.
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-jua text-base hover:bg-gray-50 transition-colors cursor-pointer"
              >
                다시 확인할래요
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-jua text-base shadow-md shadow-orange-300 transition-all cursor-pointer"
              >
                {isSubmitting ? '제출 중...' : '네, 제출해요!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
