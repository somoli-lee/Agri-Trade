
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ClipboardCheck, ArrowRight, ShieldCheck, FileText, Info, HelpCircle, Package, MapPin } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { QuarantineRoadmap as QuarantineRoadmapType } from '../types';

export default function QuarantineRoadmap() {
  const [commodity, setCommodity] = useState('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<QuarantineRoadmapType | null>(null);

  const handleFetch = async () => {
    if (!commodity || !origin) return;
    setLoading(true);
    try {
      const data = await GeminiService.fetchQuarantineRoadmap(commodity, origin);
      setRoadmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recommendedPairs = [
    { c: '냉동 망고', o: '태국' },
    { c: '치즈', o: '이탈리아' },
    { c: '커피 원두', o: '에티오피아' },
    { c: '연어', o: '노르웨이' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="panel p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-11 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm lg:text-[15px] uppercase tracking-widest font-bold text-theme-text-muted mb-3 block text-left whitespace-nowrap">수입 품목</label>
              <div className="relative group">
                <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-theme-accent transition-colors" size={20} />
                <input 
                  type="text" 
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  placeholder="예: 냉동 망고, 소고기..."
                  className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-14 pr-6 py-4 text-theme-text-main font-sans focus:outline-none focus:border-theme-accent transition-all text-base lg:text-lg font-bold placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm lg:text-[15px] uppercase tracking-widest font-bold text-theme-text-muted mb-3 block text-left whitespace-nowrap">원산지 (수출국)</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-theme-accent transition-colors" size={20} />
                <input 
                  type="text" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="예: 태국, 미국..."
                  className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-14 pr-6 py-4 text-theme-text-main font-sans focus:outline-none focus:border-theme-accent transition-all text-base lg:text-lg font-bold placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <button 
              onClick={handleFetch}
              disabled={loading || !commodity || !origin}
              className="w-full h-[60px] bg-theme-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={24} />
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <span className="text-xs lg:text-[13px] font-black text-theme-text-muted uppercase tracking-widest self-center mr-2 shrink-0 whitespace-nowrap">추천 조합:</span>
          {recommendedPairs.map((pair, idx) => (
            <button
              key={`q-pair-${idx}`}
              onClick={() => { setCommodity(pair.c); setOrigin(pair.o); }}
              className="px-4 py-2 bg-slate-100 hover:bg-theme-accent hover:text-white rounded-full text-[13px] lg:text-[14px] font-bold text-slate-500 transition-all font-mono shrink-0 whitespace-nowrap"
            >
              {pair.c} ({pair.o})
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {roadmap && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Pre-Check Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="panel overflow-hidden">
                <div className="panel-header bg-amber-500 border-none text-white flex items-center gap-2">
                   <ClipboardCheck size={18} />
                   <span>수입 전 필수 체크리스트</span>
                </div>
                <div className="p-6 space-y-4">
                  {roadmap.preCheckItems.map((item, idx) => (
                    <div key={`precheck-${idx}`} className="flex gap-4 items-start p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-bold text-amber-900 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-6 bg-theme-primary text-white border-none flex flex-col items-center text-center">
                 <ShieldCheck size={48} className="text-theme-accent mb-4" />
                 <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-2">검역 신뢰 지수</h4>
                 <p className="text-sm lg:text-[15px] text-slate-400 leading-relaxed italic mb-6">
                   "해당 품목은 최근 1년간 부적합 사례가 적어<br />정밀 검사 생략 가능성이 높습니다."
                 </p>
                 <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-theme-accent" 
                    />
                 </div>
                 <span className="mt-4 text-xs lg:text-[13px] font-bold text-theme-accent">High Reliability: 85%</span>
              </div>
            </div>

            {/* Roadmap Steps */}
            <div className="lg:col-span-8">
               <div className="panel">
                  <div className="panel-header flex justify-between items-center">
                     <span>{roadmap.commodity} 가상 검역 로드맵 ({roadmap.origin} 발)</span>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-theme-accent animate-ping" />
                        <span className="text-xs lg:text-[13px] font-black uppercase text-theme-accent tracking-widest">Live Roadmap</span>
                     </div>
                  </div>

                  <div className="p-6 lg:p-12 relative">
                     {/* Vertical Line */}
                     <div className="absolute left-[35px] lg:left-[59px] top-10 bottom-10 w-0.5 bg-theme-border hidden sm:block" />

                     <div className="space-y-12 lg:space-y-16">
                        {roadmap.steps.map((step, idx) => (
                          <motion.div 
                            key={`step-${idx}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.15 }}
                            className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8"
                          >
                            <div className="hidden sm:block relative mt-1.5 shrink-0 z-10">
                              <div className="w-6 h-6 bg-white border-4 border-theme-accent rounded-full shadow-[0_0_10px_rgba(37,99,235,0.2)]" />
                            </div>
                            
                            <div className="flex-1 space-y-4 bg-white/50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-none border-theme-border/50">
                               <div className="flex items-center gap-3">
                                  <span className="text-xs lg:text-[14px] font-black text-theme-accent uppercase tracking-[0.2em]">{step.stage}</span>
                                  <div className="hidden sm:block h-px flex-1 bg-theme-border opacity-30" />
                                  <span className="text-xs lg:text-sm font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-theme-border">
                                     <Info size={14} /> {step.authority}
                                  </span>
                               </div>

                               <h4 className="text-xl lg:text-2xl font-bold text-theme-text-main leading-none">
                                  {step.action}
                               </h4>

                               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                                  <div className="space-y-3">
                                     <p className="text-xs lg:text-[14px] font-black text-theme-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={16} className="text-theme-accent" /> 필수 서류 (Required Docs)
                                     </p>
                                     <div className="flex flex-wrap gap-2">
                                        {step.documents.map((doc, dIdx) => (
                                          <span key={`doc-${idx}-${dIdx}`} className="px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-sm lg:text-[15px] font-medium text-theme-text-main hover:border-theme-accent hover:text-theme-accent transition-all cursor-default">
                                             {doc}
                                          </span>
                                        ))}
                                     </div>
                                  </div>
                                  <div className="space-y-3">
                                     <p className="text-xs lg:text-[14px] font-black text-theme-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <HelpCircle size={16} className="text-amber-500" /> 전문가 Tip
                                     </p>
                                     <div className="p-4 lg:p-6 bg-emerald-50 border border-emerald-100 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 bg-emerald-500/10 rounded-bl-xl">
                                          <ShieldCheck size={16} className="text-emerald-500" />
                                        </div>
                                        <p className="text-sm lg:text-[16px] text-emerald-800 leading-relaxed font-medium italic">
                                          "{step.tips}"
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </motion.div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !roadmap && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-[24px] shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-6 border border-slate-100">
             <ClipboardCheck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">자동화 검역 로드맵 생성</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">수입할 품목과 원산지를 입력하시면 AI가 맞춤형 검역 절차를 설계해 드립니다.</p>
        </div>
      )}
    </div>
  );
}
