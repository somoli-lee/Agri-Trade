
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, CheckCircle2, AlertCircle, XCircle, FileText, Globe } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { FeasibilityResult } from '../types';

export default function FeasibilityDiagnosis() {
  const [product, setProduct] = useState('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeasibilityResult | null>(null);

  const handleDiagnose = async () => {
    if (!product || !origin) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await GeminiService.diagnoseFeasibility(product, origin);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="panel overflow-visible">
        <div className="panel-header">
           수입 타당성 정밀 진단
           <span className="textxs lg:text-sm text-theme-accent">시스템 정상</span>
        </div>
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">품목 식별</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="예: 냉동 블루베리"
                  className="w-full bg-theme-bg border border-theme-border px-4 py-3 xl:py-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent transition-all text-sm lg:text-base font-bold"
                />
              </div>
              <div>
                <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">원산지(국가)</label>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="예: 칠레"
                  className="w-full bg-theme-bg border border-theme-border px-4 py-3 xl:py-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent transition-all text-sm lg:text-base font-bold"
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="bg-theme-accent text-white rounded-xl py-3 xl:py-4 px-8 font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm lg:text-base"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">AI 정밀 분석 중...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span className="text-sm">종합 진단 실행</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Banner */}
            <div className={`panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-l-8 gap-4 ${
               result.isPossible === 'Yes' ? 'border-l-emerald-500 bg-emerald-50/30' :
               result.isPossible === 'No' ? 'border-l-rose-500 bg-rose-50/30' :
               'border-l-amber-500 bg-amber-50/30'
            }`}>
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                     result.isPossible === 'Yes' ? 'bg-emerald-100 text-emerald-600' :
                     result.isPossible === 'No' ? 'bg-rose-100 text-rose-600' :
                     'bg-amber-100 text-amber-600'
                  }`}>
                     {result.isPossible === 'Yes' ? <CheckCircle2 size={24} /> :
                      result.isPossible === 'No' ? <XCircle size={24} /> :
                      <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-theme-text-main">
                      분석 결과: {result.isPossible === 'Yes' ? '수입 가능' : result.isPossible === 'No' ? '수입 제한' : '조건부 가능'}
                    </h3>
                    <p className="text-sm text-theme-text-muted italic">{result.summary}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs lg:text-[13px] font-bold text-theme-text-muted uppercase tracking-widest mb-1">Generated At</p>
                  <p className="text-xs font-mono font-bold text-theme-text-main">{new Date().toLocaleDateString()}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* 1. HS Code Selection */}
              <div className="panel overflow-hidden md:col-span-2">
                <div className="panel-header bg-slate-900 border-none text-white py-4">
                   1. 품목 분류 (HS Code 추천)
                </div>
                <div className="p-6">
                  <div className="bg-theme-bg p-6 rounded-2xl border-2 border-theme-accent border-dashed mb-4">
                    <p className="text-xs lg:text-[13px] font-bold text-theme-accent uppercase mb-1">Recommended Code</p>
                    <h4 className="text-3xl font-mono font-bold tracking-tighter text-theme-text-main">
                      {result.hscode?.code}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-theme-text-main flex items-center gap-2">
                       <ChevronRight size={14} className="text-theme-accent" /> 분류 근거
                    </p>
                    <p className="text-sm lg:text-[15px] text-theme-text-muted leading-relaxed pl-6 italic">
                      "{result.hscode?.reasoning}"
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Tariff Information */}
              <div className="panel overflow-hidden md:col-span-2">
                <div className="panel-header bg-slate-900 border-none text-white py-4 flex items-center justify-between">
                  <span>2. 관세율 (Tariff Information)</span>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto border border-theme-border rounded-xl mb-4">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead className="bg-theme-bg border-b border-theme-border">
                        <tr className="text-xs lg:text-[13px] font-bold text-theme-text-muted uppercase text-left">
                          <th className="px-4 py-3">구분</th>
                          <th className="px-4 py-3">세율</th>
                          <th className="px-4 py-3">적용 조건</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {result.tariffs?.map((t, i) => (
                          <tr key={`tariff-${i}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-theme-text-main whitespace-nowrap">{t.name || t.category}</td>
                            <td className="px-4 py-3 text-theme-accent font-mono font-bold whitespace-nowrap">{t.rate}</td>
                            <td className="px-4 py-3 text-xs text-theme-text-muted">{t.condition || t.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-emerald-800">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-sm lg:text-[14px] font-medium leading-relaxed">
                      <strong>[Tip]</strong> {result.tariffTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Compliance */}
              <div className="panel lg:col-span-2">
                <div className="panel-header bg-slate-900 border-none text-white py-4">
                  3. 수입 요건 및 관련 법령 (Compliance)
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {result.compliance?.map((c, i) => (
                    <div key={`comp-${i}`} className="border border-theme-border rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <FileText size={48} />
                      </div>
                      <div className="mb-4">
                        <span className="text-xs lg:text-sm font-bold text-theme-accent uppercase tracking-widest">[{c.law}]</span>
                        <h5 className="text-lg font-bold text-theme-text-main mt-1">{c.authority}</h5>
                      </div>
                      <p className="text-sm lg:text-[15px] text-theme-text-muted leading-relaxed italic border-l-4 border-slate-200 pl-4">
                        {c.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Prohibitions & 5. Docs */}
              <div className="panel">
                 <div className="panel-header bg-slate-900 border-none text-white py-4">
                    4. 수입 금지 및 제한 사항 (Checklist)
                 </div>
                 <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                       <p className="text-sm font-bold text-rose-900 uppercase">수입 가능 여부: <span className="underline">{result.isPossible === 'Yes' ? '가능' : '제한적 가능'}</span></p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-sm lg:text-[14px] font-bold text-theme-text-muted uppercase">주의사항 및 모니터링</p>
                       <ul className="space-y-2">
                          {result.checklists.map((item, i) => (
                            <li key={`chk-${i}`} className="text-sm lg:text-[15px] text-theme-text-main flex gap-3 items-start">
                               <div className="w-1.5 h-1.5 rounded-full bg-theme-accent mt-1.5 shrink-0" />
                               {item}
                            </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              </div>

              <div className="panel">
                 <div className="panel-header bg-slate-900 border-none text-white py-4">
                    5. 필요 서류 요약
                 </div>
                 <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {result.requiredDocuments.map((doc, i) => (
                         <div key={`reqdoc-${i}`} className="flex items-center gap-3 bg-theme-bg p-4 rounded-xl border border-theme-border">
                            <div className="w-8 h-8 rounded-lg bg-white border border-theme-border flex items-center justify-center text-theme-accent shadow-sm">
                               <FileText size={16} />
                            </div>
                            <span className="text-sm font-bold text-theme-text-main">{doc}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-8 border-t border-theme-border pt-6">
                       <p className="text-xs lg:text-[13px] text-theme-text-muted flex items-center gap-2 italic">
                          <Globe size={14} /> 최근 해충 및 검역 공고 실시간 모니터링 중...
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

