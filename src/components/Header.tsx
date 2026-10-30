import React from 'react';
import { Sparkles, Volume2, VolumeX, Radio, GraduationCap, Users } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface HeaderProps {
  currentView: 'student' | 'teacher';
  onViewChange: (view: 'student' | 'teacher') => void;
  isLiveConnected: boolean;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isLiveConnected,
  activeCount,
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-amber-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-md shadow-amber-200/50 text-2xl transform hover:rotate-6 transition-transform">
            🐿️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-jua text-xl sm:text-2xl text-amber-900 tracking-tight flex items-center gap-1.5">
                쑥쑥 미디어 지킴이
                <span className="hidden sm:inline-block text-xs bg-amber-100 text-amber-800 font-sans font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  초등 3학년 국어
                </span>
              </h1>
            </div>
            <p className="text-xs text-amber-700/80 font-medium hidden sm:block">
              초상권 · 개인정보 보호 · 온라인 글쓰기 예절 실시간 퀴즈
            </p>
          </div>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Status indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isLiveConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
            title={isLiveConnected ? '중앙 서버와 실시간으로 연결되어 있습니다' : '오프라인 버퍼 모드'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <Radio className="w-3.5 h-3.5" />
            <span>{isLiveConnected ? '실시간 연동 중' : '로컬 모드'}</span>
            <span className="bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {activeCount}명 응답
            </span>
          </div>

          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            aria-label="효과음 켜기/끄기"
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            title={soundOn ? '효과음 끄기' : '효과음 켜기'}
          >
            {soundOn ? <Volume2 className="w-5 h-5 text-amber-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </button>

          {/* Mode Tabs */}
          <div className="bg-amber-100/80 p-1 rounded-2xl flex items-center border border-amber-200">
            <button
              onClick={() => {
                sounds.playClick();
                onViewChange('student');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-jua transition-all ${
                currentView === 'student'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>학생 퀴즈</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onViewChange('teacher');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-jua transition-all ${
                currentView === 'teacher'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>교사 대시보드</span>
              {activeCount > 0 && currentView !== 'teacher' && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-sans font-bold">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
