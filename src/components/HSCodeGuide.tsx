
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info, HelpCircle, ArrowRight, CheckCircle, ExternalLink, FileText } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { HSCodeRecommendation } from '../types';

export default function HSCodeGuide() {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ recommendations: HSCodeRecommendation[], rulings: any[] } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [unipassSearchCode, setUnipassSearchCode] = useState('');
  const [unipassSearchResults, setUnipassSearchResults] = useState<any[]>([]);
  const [isUnipassLoading, setIsUnipassLoading] = useState(false);
  const [hasUnipassSearchAttempted, setHasUnipassSearchAttempted] = useState(false);
  const [unipassSearchError, setUnipassSearchError] = useState<string | null>(null);

  const handleUnipassSearch = async () => {
    if (!unipassSearchCode) return;
    setIsUnipassLoading(true);
    setUnipassSearchResults([]);
    setHasUnipassSearchAttempted(false);
    setUnipassSearchError(null);
    
    try {
      // Clean dots and other non-alphanumeric chars for HS search
      const cleanSearch = unipassSearchCode.replace(/[^a-zA-Z0-9]/g, '');
      const response = await fetch(`/api/unipass/hscode-search?hsSgn=${cleanSearch}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API server returned an error');
      }
      const data = await response.json();
      setUnipassSearchResults(Array.isArray(data) ? data : []);
      setHasUnipassSearchAttempted(true);
    } catch (err: any) {
      console.error("UNIPASS HS search failed:", err);
      setUnipassSearchError(err.message || "연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsUnipassLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!desc) return;
    setLoading(true);
    setData(null);
    setSelectedIndex(0);
    try {
      const result = await GeminiService.recommendHSCode(desc);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const current = data?.recommendations[selectedIndex];

  const handleSelectCode = (idx: number) => {
    setSelectedIndex(idx);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel">
          <div className="panel-header">AI 품목분류 분석 엔진 (관세청 판례 연동)</div>
          
          <div className="p-6">
             <div className="mb-4">
                <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">품목 상세 정보 (관세 판례 검색 병행)</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="상세한 품명, 용도, 가공법을 입력할수록 정확한 판례를 매칭합니다..."
                  className="w-full bg-theme-bg border border-theme-border px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent transition-all text-sm font-sans"
                />
             </div>

             <button
               onClick={handleSearch}
               disabled={loading || !desc}
               className="w-full bg-theme-primary text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
             >
               {loading ? (
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span className="text-xs lg:text-[13px]">결정사례 API 분석 중...</span>
                 </div>
               ) : (
                 <>
                   <Search size={16} />
                   <span className="text-sm">HS Code 예측</span>
                 </>
               )}
             </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">관세청 UNIPASS 공식 HS부호 조회</div>
          
          <div className="p-6">
             <div className="mb-4">
                <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">HS 코드 직접 검색 (부호 또는 영문명)</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={unipassSearchCode}
                    onChange={(e) => {
                      setUnipassSearchCode(e.target.value);
                      if (hasUnipassSearchAttempted) setHasUnipassSearchAttempted(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnipassSearch()}
                    placeholder="예: 0303.54 (도트 포함 가능)"
                    className="w-full bg-theme-bg border border-theme-border pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent font-sans text-sm font-bold"
                  />
                  <button 
                    onClick={handleUnipassSearch}
                    className="absolute right-2 top-2 p-1.5 text-theme-accent hover:bg-theme-accent/20 rounded-lg transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
             </div>

             <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                {isUnipassLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin" />
                  </div>
                ) : unipassSearchResults.length > 0 ? (
                  unipassSearchResults.map((res, i) => (
                    <div 
                      key={`unipass-res-${i}`} 
                      onClick={() => {
                        const code = res.hsSgn?.[0];
                        if (code) {
                          setUnipassSearchCode(code);
                        }
                      }}
                      className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-theme-accent transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-black text-theme-primary">{res.hsSgn?.[0]}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{res.txrt?.[0] ? `${res.txrt[0]}%` : '-'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{res.korePrnm?.[0]}</p>
                      <p className="text-[9px] text-slate-400 truncate tracking-tight">{res.englPrnm?.[0]}</p>
                    </div>
                  ))
                ) : unipassSearchError ? (
                  <div className="text-center py-4 bg-red-50 border border-red-100 rounded-xl">
                    <HelpCircle size={16} className="mx-auto text-red-400 mb-1" />
                    <p className="text-[10px] text-red-500 font-bold">{unipassSearchError}</p>
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                    <Info size={16} className="mx-auto text-slate-200 mb-1" />
                    <p className="text-[10px] text-slate-400 font-medium">
                      {hasUnipassSearchAttempted ? '검색 결과가 없습니다' : '부호 4~10자리를 입력하여 검색'}
                    </p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {data && current && (
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Sidebar with all 5 results */}
            <div className="lg:col-span-4 space-y-6">
               <div className="panel overflow-hidden">
                  <div className="panel-header bg-slate-900 border-none text-white text-[10px] py-4">식별된 후보군 (Top 5)</div>
                  <div className="divide-y divide-theme-border">
                     {data.recommendations.map((rec, idx) => (
                        <button 
                           key={`rec-${idx}`}
                           onClick={() => handleSelectCode(idx)}
                           className={`w-full text-left p-5 transition-all flex items-center justify-between hover:bg-slate-50 ${
                              selectedIndex === idx ? 'bg-theme-accent/5 border-r-4 border-theme-accent' : ''
                           }`}
                        >
                           <div className="flex flex-col gap-1 items-start">
                              <p className="text-[10px] font-bold text-theme-text-muted uppercase mb-1">Rank #{idx + 1}</p>
                              <h4 className="text-lg font-mono font-bold text-theme-text-main">{rec.hscode}</h4>
                              {rec.expectedTariff && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">예상세율: {rec.expectedTariff}</span>
                              )}
                           </div>
                           <div className="text-right flex flex-col items-end">
                              <p className="text-[10px] font-bold text-theme-accent">{Math.round(rec.confidence * 100)}% Match</p>
                              {selectedIndex === idx && <ArrowRight size={14} className="text-theme-accent mt-2" />}
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Rulings Section */}
               <div className="panel overflow-hidden">
                  <div className="panel-header bg-slate-100 text-xs text-slate-700 py-3 font-bold uppercase tracking-wide">참조된 관세청 실무 판례</div>
                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                     {data.rulings && data.rulings.length > 0 ? (
                        data.rulings.map((r, i) => (
                           <div key={`ruling-${i}`} className="p-4 bg-theme-bg border border-theme-border rounded-xl group hover:border-theme-accent transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs lg:text-[13px] font-mono font-black text-theme-accent px-2 py-1 bg-theme-accent/5 rounded-md">
                                    {Array.isArray(r.hscode) ? r.hscode[0] : r.hscode}
                                 </span>
                              </div>
                              <p className="text-sm lg:text-[14px] leading-relaxed font-bold text-theme-text-main">
                                 {Array.isArray(r.itemNm) ? r.itemNm[0] : r.itemNm}
                              </p>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-theme-text-muted text-center py-8 italic">참조 데이터 없음</p>
                     )}
                  </div>
               </div>
            </div>

            {/* Detailed Analysis of Selected HS Code */}
            <div className="lg:col-span-8 space-y-6">
               <div className="panel bg-gradient-to-br from-indigo-50 to-blue-50 text-slate-800 border-none p-6 lg:p-10 relative overflow-hidden shadow-lg border border-slate-200">
                  <div className="absolute top-[-40px] right-[-40px] w-48 h-48 lg:w-64 lg:h-64 bg-blue-200/50 rounded-full blur-3xl" />
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                       <p className="text-[10px] lg:text-[11px] uppercase tracking-widest font-bold text-slate-500 px-3 py-1 border border-slate-200 rounded-full w-fit bg-white">Selected Classification</p>
                       {current.expectedTariff && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                             <CheckCircle size={14} className="text-amber-500" />
                             <span className="text-[11px] font-bold text-amber-800 tracking-wide">예상관세율: {current.expectedTariff}</span>
                          </div>
                       )}
                     </div>
                     <h3 className="text-3xl sm:text-4xl lg:text-7xl font-mono tracking-tighter text-blue-600 mb-6 leading-none whitespace-nowrap drop-shadow-sm">{current.hscode}</h3>
                     <p className="text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mb-8 text-slate-700">{current.description}</p>
                     
                     <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-blue-200/50">
                        {current.dataSource && (
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-100/50 px-3 py-2 rounded-lg">
                             <CheckCircle size={16} className="text-emerald-500" /> 
                             <span><strong className="text-emerald-800">데이터 출처:</strong> {current.dataSource}</span>
                          </div>
                        )}
                        {current.validationStatus && (
                          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-100/50 px-3 py-2 rounded-lg">
                             <Info size={16} className="text-amber-500" /> 
                             <span><strong className="text-amber-800">검증 현황:</strong> {current.validationStatus}</span>
                          </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="panel p-6 lg:p-8">
                  <div className="bg-theme-bg rounded-2xl p-6 lg:p-8 border border-theme-border mb-8">
                     <h4 className="flex items-center gap-2 text-xs font-bold text-theme-text-main mb-4 uppercase tracking-widest">
                        <Info size={16} className="text-theme-accent" /> Grounded Classification Logic
                     </h4>
                     <p className="text-sm lg:text-base text-theme-text-muted leading-relaxed italic border-l-4 border-theme-accent pl-4 lg:pl-6 py-2">
                        "{current.reasoning}"
                     </p>
                  </div>

                  {current.decisionTree && (
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest px-4">Verification Checkpoint</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {current.decisionTree.map((question, idx) => (
                           <div key={`tree-${idx}`} className="flex gap-4 items-center bg-theme-bg border border-theme-border p-4 rounded-xl">
                              <div className="w-6 h-6 rounded bg-theme-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
                                 {idx + 1}
                              </div>
                              <p className="text-xs font-medium text-theme-text-main leading-snug">{question}</p>
                           </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

