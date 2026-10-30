import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, Eye } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface StudentEntryProps {
  onStart: (name: string, studentClass: string) => void;
}

export const StudentEntry: React.FC<StudentEntryProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('3학년 1반');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해 주세요! (예: 김민우)');
      sounds.playClick();
      return;
    }
    setError('');
    sounds.playNext();
    onStart(name.trim(), studentClass.trim());
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-200 text-center relative overflow-hidden">
        {/* Decorative corner stars */}
        <div className="absolute top-3 left-4 text-2xl animate-float">✨</div>
        <div className="absolute top-4 right-4 text-2xl animate-float" style={{ animationDelay: '1s' }}>🌟</div>
        <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-amber-100 rounded-full opacity-60 pointer-events-none" />

        {/* Mascot */}
        <div className="w-24 h-24 mx-auto bg-amber-100 border-4 border-amber-300 rounded-full flex items-center justify-center text-5xl shadow-inner mb-4 animate-bounce-gentle">
          🐿️
        </div>

        <div className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
          3학년 국어 매체 단원 퀴즈
        </div>
        <h2 className="font-jua text-2xl sm:text-3xl text-amber-950 mb-2">
          안녕! 나는 미디어 지킴이 토리야!
        </h2>
        <p className="text-sm sm:text-base text-amber-800/90 mb-6 leading-relaxed">
          초상권, 개인정보 보호, 온라인 글쓰기 예절에 대한 <br className="hidden sm:inline" />
          재미있는 퀴즈 10문제를 풀고 <strong>‘미디어 지킴이 임명장’</strong>을 받아보자! 🎖️
        </p>

        {/* 3 Pillars Preview */}
        <div className="grid grid-cols-3 gap-2 mb-8 text-left">
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">📸</span>
            <span className="text-xs font-jua text-amber-900">초상권 지키기</span>
            <span className="text-[10px] text-amber-700">허락받고 올리기</span>
          </div>
          <div className="bg-orange-50 p-2.5 rounded-2xl border border-orange-200 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">🔒</span>
            <span className="text-xs font-jua text-orange-900">개인정보 보호</span>
            <span className="text-[10px] text-orange-700">소중한 비밀 지키기</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-200 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">💬</span>
            <span className="text-xs font-jua text-rose-900">온라인 예절</span>
            <span className="text-[10px] text-rose-700">고운 말 댓글 달기</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1">
              <span>내 이름</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="예: 김민우"
              maxLength={20}
              className="w-full px-4 py-3 text-base rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-hidden bg-amber-50/50 font-bold placeholder:text-gray-400 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center justify-between">
              <span>학년과 반 / 번호</span>
              <span className="text-[11px] text-amber-600 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="예: 3학년 1반 12번"
              maxLength={30}
              className="w-full px-4 py-3 text-base rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-hidden bg-amber-50/50 font-medium placeholder:text-gray-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-jua text-lg sm:text-xl shadow-lg shadow-orange-300/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>퀴즈 시작하기!</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          💡 별도의 비밀번호 없이 이름만 적고 바로 풀 수 있어요!
        </p>
      </div>
    </div>
  );
};
