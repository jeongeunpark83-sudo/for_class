import React, { useState } from 'react';
import { X, Copy, Check, Database, Flame, Server, Shield, BookOpen } from 'lucide-react';
import {
  SUPABASE_SQL_SCHEMA,
  FIREBASE_FIRESTORE_STRUCTURE,
  FIREBASE_SECURITY_RULES,
  INTEGRATION_GUIDE,
} from '../../data/dbSchemaDocs';
import { sounds } from '../../utils/soundEffects';

interface DBSettingsModalProps {
  onClose: () => void;
  isLiveConnected: boolean;
}

export const DBSettingsModal: React.FC<DBSettingsModalProps> = ({
  onClose,
  isLiveConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'firebase' | 'builtin'>('supabase');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    sounds.playClick();
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xl">
              🗄️
            </div>
            <div>
              <h3 className="font-jua text-xl flex items-center gap-2">
                <span>중앙 백엔드 DB 구조 및 연동 설정</span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                모든 학생 기기(스마트폰, 태블릿, PC)의 응답을 실시간 동기화하기 위한 아키텍처
              </p>
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

        {/* Tab selection */}
        <div className="bg-slate-100 p-2 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('supabase');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Supabase (PostgreSQL)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('firebase');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>2. Firebase (Firestore)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('builtin');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'builtin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. 현재 내장 실시간 서버</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span>Supabase 테이블 설계 및 실시간(Realtime) 설정</span>
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Supabase의 <strong>PostgreSQL</strong> 테이블 구조입니다. 학생은 별도 로그인 없이
                  <code className="bg-emerald-100 px-1 rounded-sm mx-1">quiz_submissions</code>에 INSERT할 수 있고,
                  교사는 <strong>Supabase Realtime</strong> 구독을 통해 즉시 응답을 실시간으로 수신합니다.
                </p>
              </div>

              {/* SQL Code Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Supabase SQL 스키마 (SQL Editor에 실행)</span>
                  <button
                    onClick={() => handleCopy(SUPABASE_SQL_SCHEMA, 'supabase_sql')}
                    className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'supabase_sql' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>SQL 복사하기</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-700">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              {/* Step Guide */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Supabase 연결 단계별 가이드:</span>
                </h5>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-5">
                  {INTEGRATION_GUIDE.supabase.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-amber-700" />
                  <span>Firebase Firestore 컬렉션 및 실시간 리스너 구조</span>
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Firebase의 <strong>Cloud Firestore</strong> NoSQL 구조입니다. 학생은 로그인 없이 문서를
                  추가하고, 교사는 <code className="bg-amber-100 px-1 rounded-sm mx-1">onSnapshot()</code> 리스너를
                  통해 실시간으로 스트리밍을 수신합니다.
                </p>
              </div>

              {/* Document Structure */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Firestore 문서 데이터 구조</span>
                  <button
                    onClick={() => handleCopy(FIREBASE_FIRESTORE_STRUCTURE, 'fb_struct')}
                    className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'fb_struct' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>JSON 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-amber-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-700">
                  {FIREBASE_FIRESTORE_STRUCTURE}
                </pre>
              </div>

              {/* Security Rules */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Firestore 보안 규칙 (firestore.rules)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(FIREBASE_SECURITY_RULES, 'fb_rules')}
                    className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'fb_rules' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>규칙 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-700">
                  {FIREBASE_SECURITY_RULES}
                </pre>
              </div>

              {/* Step Guide */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Firebase 연결 단계별 가이드:</span>
                </h5>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-5">
                  {INTEGRATION_GUIDE.firebase.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'builtin' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <h4 className="text-sm font-bold text-indigo-950">
                    현재 동작 중인 내장 실시간 서버 (Express + Server-Sent Events)
                  </h4>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  이 웹앱은 별도 외부 DB 설정 없이도 다른 기기(스마트폰, 태블릿, PC)에서 즉시 실시간 동기화가 동작하도록
                  <strong>내장 실시간 동기화 엔진</strong>이 포트 3000에서 상시 실행 중입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-800 block mb-1">🔗 실시간 통신 방식</span>
                  <span className="text-gray-600">
                    HTTP SSE (Server-Sent Events) 스트림 <code className="bg-gray-100 px-1">/api/events</code>
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-800 block mb-1">💾 데이터 영속성</span>
                  <span className="text-gray-600">
                    서버 메모리 + <code className="bg-gray-100 px-1">/data/submissions.json</code> 자동 저장
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                💡 <strong>멀티 디바이스 테스트 방법:</strong> 선생님 컴퓨터에서 교사 대시보드를 열어두고,
                스마트폰이나 태블릿으로 동일한 주소(또는 QR 코드)를 접속하여 학생 모드로 제출해 보세요.
                새로고침 없이 0.1초 만에 화면에 나타납니다!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
