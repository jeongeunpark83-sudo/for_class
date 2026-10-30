import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  StudentSubmission,
  QuizQuestion,
  QuizStatsSummary,
} from '../../types/quiz';
import { api } from '../../services/api';
import { sounds } from '../../utils/soundEffects';
import { StudentPaperModal } from './StudentPaperModal';
import { DBSettingsModal } from './DBSettingsModal';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  QrCode,
  Download,
  Database,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Radio,
} from 'lucide-react';

interface TeacherDashboardProps {
  submissions: StudentSubmission[];
  questions: QuizQuestion[];
  isLiveConnected: boolean;
  onRefresh: () => void;
  latestSubmissionAlert: StudentSubmission | null;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  questions,
  isLiveConnected,
  onRefresh,
  latestSubmissionAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'db'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'scoreHigh' | 'scoreLow' | 'name'>('latest');
  const [inspectSubmission, setInspectSubmission] = useState<StudentSubmission | null>(null);
  const [showDBSettings, setShowDBSettings] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedURL, setCopiedURL] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR code when QR modal is opened
  useEffect(() => {
    if (showQRModal && qrCanvasRef.current) {
      const studentUrl = typeof window !== 'undefined' ? window.location.href : '';
      QRCode.toCanvas(
        qrCanvasRef.current,
        studentUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('[QR] Error generating QR code:', error);
        }
      );
    }
  }, [showQRModal]);

  // Compute Aggregated Statistics
  const totalSubmissions = submissions.length;
  const averageScore =
    totalSubmissions > 0
      ? Math.round(
          (submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions) * 10
        ) / 10
      : 0;
  const highestScore =
    totalSubmissions > 0 ? Math.max(...submissions.map((s) => s.score)) : 0;
  const perfectCount = submissions.filter((s) => s.score === 100).length;

  // Calculate per-question accuracy and option distribution
  const questionAnalytics = questions.map((q) => {
    let correctCount = 0;
    const optionCounts = [0, 0, 0, 0];

    submissions.forEach((s) => {
      const chosen = s.answers[q.id];
      if (chosen !== undefined && chosen >= 0 && chosen < 4) {
        optionCounts[chosen] += 1;
        if (chosen === q.correctIndex) {
          correctCount += 1;
        }
      }
    });

    const accuracyRate =
      totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;

    return {
      ...q,
      totalResponses: totalSubmissions,
      correctCount,
      accuracyRate,
      optionCounts,
    };
  });

  // Find hardest question (lowest accuracy)
  const hardestQuestion =
    totalSubmissions > 0
      ? questionAnalytics.slice().sort((a, b) => a.accuracyRate - b.accuracyRate)[0]
      : null;

  // Filter & Sort submissions
  const filteredSubmissions = submissions
    .filter((s) => {
      const matchName = s.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = s.studentClass?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchClass;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'scoreHigh') {
        return b.score - a.score;
      }
      if (sortBy === 'scoreLow') {
        return a.score - b.score;
      }
      return a.studentName.localeCompare(b.studentName, 'ko');
    });

  // Export to CSV with UTF-8 BOM (so Korean opens cleanly in Excel)
  const handleExportCSV = () => {
    sounds.playClick();
    if (submissions.length === 0) {
      alert('내보낼 학생 응답 데이터가 없습니다.');
      return;
    }

    const headers = [
      '순번',
      '학생 이름',
      '학급/번호',
      '점수',
      '맞힌 개수',
      '소요시간(초)',
      '제출 일시',
      ...questions.map((q) => `문항${q.id}_(${q.category})`),
    ];

    const rows = submissions.map((s, idx) => {
      const itemAnswers = questions.map((q) => {
        const chosen = s.answers[q.id];
        const isRight = chosen === q.correctIndex;
        return chosen !== undefined ? `${chosen + 1}번(${isRight ? 'O' : 'X'})` : '미응답';
      });

      return [
        idx + 1,
        `"${s.studentName}"`,
        `"${s.studentClass || '3학년'}"`,
        s.score,
        s.correctCount,
        s.timeSpentSeconds || 0,
        `"${new Date(s.submittedAt).toLocaleString('ko-KR')}"`,
        ...itemAnswers,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3학년_국어매체퀴즈_응답결과_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    sounds.playClick();
    setCopiedURL(true);
    setTimeout(() => setCopiedURL(false), 2000);
  };

  const handleSeedDemo = async () => {
    sounds.playClick();
    setIsSeeding(true);
    await api.seedSubmissions();
    setIsSeeding(false);
    onRefresh();
  };

  const handleResetData = async () => {
    if (!window.confirm('정말로 모든 학생의 퀴즈 응답 데이터를 초기화하시겠습니까?')) {
      return;
    }
    sounds.playClick();
    setIsResetting(true);
    await api.resetSubmissions();
    setIsResetting(false);
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-amber-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-jua text-2xl sm:text-3xl text-amber-950">
                교사 실시간 대시보드
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                실시간 수집 활성화
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800/80 mt-1">
              학생들이 각자 기기(스마트폰, 태블릿, PC)에서 제출하면 <strong>새로고침 없이 즉시</strong> 업데이트됩니다.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setShowQRModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-jua text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>학생 접속 QR 코드</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-jua text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>엑셀(CSV) 저장</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowDBSettings(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-jua text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>DB 연동 구조</span>
            </button>

            {totalSubmissions === 0 && (
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-jua text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>{isSeeding ? '생성 중...' : '샘플 학생 5명 생성'}</span>
              </button>
            )}

            {totalSubmissions > 0 && (
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="데이터 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time Alert Toast when incoming submission arrives */}
        {latestSubmissionAlert && (
          <div className="mt-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3 flex items-center justify-between animate-bounce-gentle">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-900 font-medium">
              <span className="text-xl">🎉</span>
              <span>
                <strong>[방금 도착]</strong> {latestSubmissionAlert.studentName} 학생({latestSubmissionAlert.studentClass || '3학년'})이
                응답을 제출했습니다! (<strong>{latestSubmissionAlert.score}점</strong>)
              </span>
            </div>
            <button
              onClick={() => setInspectSubmission(latestSubmissionAlert)}
              className="text-xs font-jua text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs cursor-pointer"
            >
              시험지 보기
            </button>
          </div>
        )}
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border-2 border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-800 font-medium">제출 인원</div>
            <div className="font-jua text-2xl sm:text-3xl text-amber-950 flex items-baseline gap-1">
              <span>{totalSubmissions}</span>
              <span className="text-sm font-sans text-amber-700">명</span>
            </div>
          </div>
        </div>

        {/* Class Average Score */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border-2 border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-emerald-800 font-medium">학급 평균 점수</div>
            <div className="font-jua text-2xl sm:text-3xl text-emerald-950 flex items-baseline gap-1">
              <span>{averageScore}</span>
              <span className="text-sm font-sans text-emerald-700">점</span>
            </div>
          </div>
        </div>

        {/* Perfect Scores */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border-2 border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-orange-800 font-medium">만점자 (100점)</div>
            <div className="font-jua text-2xl sm:text-3xl text-orange-950 flex items-baseline gap-1">
              <span>{perfectCount}</span>
              <span className="text-sm font-sans text-orange-700">명 ({totalSubmissions > 0 ? Math.round((perfectCount / totalSubmissions) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

        {/* Hardest Question */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border-2 border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-rose-800 font-medium truncate">오답률 1위 문항</div>
            <div className="font-jua text-lg sm:text-xl text-rose-950 truncate">
              {hardestQuestion ? `문항 ${hardestQuestion.id}번 (${hardestQuestion.accuracyRate}% 정답)` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="bg-white rounded-3xl shadow-md border-2 border-amber-200 overflow-hidden">
        <div className="bg-amber-50/70 p-2 sm:p-3 border-b-2 border-amber-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('list');
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-jua transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-amber-100'
              }`}
            >
              📋 실시간 학생 제출 명단 ({totalSubmissions})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('analytics');
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-jua transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-amber-100'
              }`}
            >
              📊 문항별 정답률 & 선택지 분석
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('db');
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-jua transition-all cursor-pointer ${
                activeTab === 'db'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-amber-100'
              }`}
            >
              🗄️ 백엔드 DB 구조 및 연동
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="학생 이름 검색..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-hidden focus:border-amber-500 w-36 sm:w-48"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-xl border border-amber-200 bg-white font-medium text-gray-700 focus:outline-hidden cursor-pointer"
              >
                <option value="latest">최신 제출순</option>
                <option value="scoreHigh">점수 높은순</option>
                <option value="scoreLow">점수 낮은순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Live Submissions Table */}
        {activeTab === 'list' && (
          <div className="p-4 sm:p-6">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">🎒</div>
                <h4 className="font-jua text-xl text-gray-700 mb-1">
                  {totalSubmissions === 0
                    ? '아직 제출된 학생 응답이 없습니다.'
                    : '검색 조건에 맞는 학생이 없습니다.'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  학생들이 상단 <strong>‘학생 접속 QR 코드’</strong>를 스캔하거나 링크를 통해 퀴즈를 풀고 제출하면
                  이곳에 실시간으로 표시됩니다.
                </p>
                {totalSubmissions === 0 && (
                  <button
                    onClick={handleSeedDemo}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-jua shadow-xs cursor-pointer"
                  >
                    샘플 학생 5명 데이터 넣어보기
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-100 text-amber-900 font-jua text-xs">
                      <th className="py-3 px-3">순번</th>
                      <th className="py-3 px-3">학생 이름</th>
                      <th className="py-3 px-3">학급/번호</th>
                      <th className="py-3 px-3 text-center">점수</th>
                      <th className="py-3 px-3 text-center">맞힌 개수</th>
                      <th className="py-3 px-3 text-center">소요 시간</th>
                      <th className="py-3 px-3">제출 시각</th>
                      <th className="py-3 px-3 text-right">상세 확인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {filteredSubmissions.map((sub, idx) => {
                      const isTop = sub.score === 100;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-amber-50/50 transition-colors"
                        >
                          <td className="py-3.5 px-3 text-gray-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{sub.studentName}</span>
                            {isTop && <span title="만점자">👑</span>}
                          </td>
                          <td className="py-3.5 px-3 text-gray-600 font-medium">
                            {sub.studentClass || '3학년'}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`font-jua text-sm px-2.5 py-0.5 rounded-full ${
                                sub.score === 100
                                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                  : sub.score >= 80
                                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                  : sub.score >= 60
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {sub.score}점
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center text-gray-700 font-medium">
                            <strong className="text-emerald-700">{sub.correctCount}</strong> / {sub.totalQuestions}
                          </td>
                          <td className="py-3.5 px-3 text-center text-gray-500 text-xs">
                            {sub.timeSpentSeconds || 60}초
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 text-xs">
                            {new Date(sub.submittedAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setInspectSubmission(sub);
                              }}
                              className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-jua transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>시험지 보기</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Question Deep Analysis */}
        {activeTab === 'analytics' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div>
                <h4 className="font-jua text-base text-amber-950">
                  10문항별 정답률 및 선택지 분석 (총 {totalSubmissions}명 응답)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  각 문항별로 학생들이 어떤 보기를 선택했는지와 지도 중점 사항을 확인할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionAnalytics.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-jua text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                          문항 {q.id}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">[{q.category}]</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">정답률</span>
                        <span
                          className={`font-jua text-sm px-2 py-0.5 rounded-md ${
                            q.accuracyRate >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.accuracyRate >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.accuracyRate}%
                        </span>
                      </div>
                    </div>

                    <h5 className="font-jua text-base text-gray-900 mb-1.5">{q.title}</h5>
                    <p className="text-xs text-gray-600 mb-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      {q.scenario}
                    </p>

                    {/* Option distribution bars */}
                    <div className="space-y-1.5 text-xs mb-3">
                      {q.options.map((opt, optIdx) => {
                        const count = q.optionCounts[optIdx];
                        const percent =
                          totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
                        const isCorrect = q.correctIndex === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border relative overflow-hidden ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 opacity-20 pointer-events-none ${
                                isCorrect ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                            <div className="relative flex items-center justify-between z-10">
                              <span className="truncate pr-2">
                                {optIdx + 1}. {opt}
                              </span>
                              <span className="shrink-0 font-mono text-[11px]">
                                {count}명 ({percent}%) {isCorrect && '✓'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teaching guidance */}
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                    <strong>💡 지도 중점:</strong> {q.teachingPoint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: DB Integration direct view */}
        {activeTab === 'db' && (
          <div className="p-4 sm:p-6">
            <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-jua text-lg text-white">
                    중앙 클라우드 데이터베이스 아키텍처
                  </h4>
                </div>
                <button
                  onClick={() => setShowDBSettings(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-jua transition-colors cursor-pointer"
                >
                  전체 설정 및 복사 모달 열기
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                학생 기기(스마트폰, 태블릿, PC)에서 보낸 응답은 즉시 중앙 백엔드 DB로 전송되며, 교사 화면에는
                Websocket / Server-Sent Events 리스너를 통해 0.1초 만에 자동 반영됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/30">
                <h5 className="font-jua text-base text-emerald-950 mb-1 flex items-center gap-2">
                  <span>Supabase (PostgreSQL) 연동 모델</span>
                </h5>
                <p className="text-xs text-emerald-800 mb-3">
                  관계형 데이터베이스에 저장하고 Supabase Realtime 채널을 구독합니다.
                </p>
                <div className="bg-slate-900 text-emerald-300 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-40">
                  CREATE TABLE quiz_submissions (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY,<br />
                  &nbsp;&nbsp;student_name VARCHAR(50) NOT NULL,<br />
                  &nbsp;&nbsp;answers JSONB NOT NULL,<br />
                  &nbsp;&nbsp;score INTEGER NOT NULL,<br />
                  &nbsp;&nbsp;created_at TIMESTAMPTZ DEFAULT NOW()<br />
                  );
                </div>
              </div>

              <div className="border-2 border-amber-200 rounded-2xl p-4 bg-amber-50/30">
                <h5 className="font-jua text-base text-amber-950 mb-1 flex items-center gap-2">
                  <span>Firebase (Firestore) 연동 모델</span>
                </h5>
                <p className="text-xs text-amber-800 mb-3">
                  NoSQL 문서 데이터베이스에 실시간 onSnapshot 리스너를 바인딩합니다.
                </p>
                <div className="bg-slate-900 text-amber-200 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-40">
                  collection: &quot;quiz_submissions&quot;<br />
                  fields: &#123;<br />
                  &nbsp;&nbsp;studentName: string,<br />
                  &nbsp;&nbsp;score: number,<br />
                  &nbsp;&nbsp;answers: map,<br />
                  &nbsp;&nbsp;submittedAt: timestamp<br />
                  &#125;
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code & Share Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-amber-300 relative">
            <h3 className="font-jua text-2xl text-amber-950 mb-1">
              학생 기기 접속 QR 코드
            </h3>
            <p className="text-xs text-amber-800 mb-4">
              태블릿이나 스마트폰 카메라로 QR 코드를 스캔하면 학생 퀴즈 화면으로 바로 연결됩니다!
            </p>

            {/* QR Canvas */}
            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 inline-block mb-4 shadow-inner">
              <canvas ref={qrCanvasRef} className="mx-auto rounded-lg" />
            </div>

            {/* Copy Link Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-jua text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {copiedURL ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>주소 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>퀴즈 접속 주소 복사하기</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowQRModal(false);
                }}
                className="w-full py-2 px-4 rounded-xl text-gray-600 hover:bg-gray-100 font-jua text-xs transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Paper Inspector Modal */}
      {inspectSubmission && (
        <StudentPaperModal
          submission={inspectSubmission}
          questions={questions}
          onClose={() => setInspectSubmission(null)}
        />
      )}

      {/* DB Settings and Schemas Modal */}
      {showDBSettings && (
        <DBSettingsModal
          onClose={() => setShowDBSettings(false)}
          isLiveConnected={isLiveConnected}
        />
      )}
    </div>
  );
};
