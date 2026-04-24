
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ship, MapPin, ArrowRight, Anchor, Clock, TrendingUp, Search } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { LogisticsRoute } from '../types';

export default function LogisticsSimulator() {
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);

  const handleSimulate = async () => {
    if (!origin) return;
    setLoading(true);
    try {
      const data = await GeminiService.fetchLogisticsRoutes(origin);
      setRoutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="panel p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full text-left">
            <label className="text-sm lg:text-[15px] uppercase tracking-widest font-bold text-theme-text-muted mb-3 block text-left whitespace-nowrap">출발지 기반 물류 경로 시뮬레이션</label>
            <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-theme-accent transition-colors" size={20} />
              <input 
                type="text" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                placeholder="출발 국가 또는 항구를 입력하세요 (예: 태국 방콕, 브라질 산투스...)"
                className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-14 pr-6 py-4 text-theme-text-main font-sans focus:outline-none focus:border-theme-accent transition-all text-base lg:text-lg font-bold placeholder:text-slate-300 placeholder:font-normal"
              />
            </div>
          </div>
          <button 
            onClick={handleSimulate}
            disabled={loading || !origin}
            className="w-full lg:w-auto h-[60px] px-10 bg-theme-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base lg:text-[18px] whitespace-nowrap shrink-0"
          >
           {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
           ) : (
             <>
               <Ship size={20} />
               <span>경로 시뮬레이션</span>
             </>
           )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {routes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {routes.map((route, idx) => (
              <div key={`route-opt-${idx}`} className="panel overflow-hidden border-2 hover:border-theme-accent transition-all">
                <div className="panel-header bg-slate-50 flex justify-between items-center text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <TrendingUp size={16} className="text-theme-accent" />
                    </div>
                    <span>경로 옵션 #{idx + 1}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-theme-accent">{route.transportType === 'Sea' ? '해상 운송' : '항공 운송'}</span>
                </div>
                <div className="p-10">
                  <div className="flex items-center justify-between relative mb-12">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-sm mb-2" />
                      <p className="text-sm lg:text-[14px] font-black uppercase text-theme-text-main">{route.origin}</p>
                    </div>
                    <div className="relative z-10 bg-white px-4">
                      {route.transportType === 'Sea' ? <Ship size={20} className="text-slate-300 animate-bounce" /> : <div className="text-xl">✈️</div>}
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-theme-accent border-4 border-white shadow-sm mb-2" />
                      <p className="text-sm lg:text-[14px] font-black uppercase text-theme-text-main">{route.destination}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-theme-accent" />
                        <span className="text-xs lg:text-[13px] font-black text-theme-text-muted uppercase">예상 소요 시간</span>
                      </div>
                      <p className="text-3xl font-mono font-bold text-theme-text-main">{route.estimatedDays} <span className="text-sm uppercase">Days</span></p>
                    </div>
                    <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Anchor size={16} className="text-theme-accent" />
                        <span className="text-xs lg:text-[13px] font-black text-theme-text-muted uppercase">환적/경유지</span>
                      </div>
                      <p className="text-lg font-bold text-theme-text-main">{route.transitPorts.join(', ') || '직항'}</p>
                    </div>
                  </div>
                </div>
                <div className="px-10 py-6 bg-slate-50 border-t border-theme-border">
                   <p className="text-xs lg:text-[13px] text-slate-500 italic text-center leading-relaxed">
                     * 수입 농축산물 검역 및 통과 절차에 따라 소요 시간은 변동될 수 있습니다. 
                     해당 경로는 AI가 제안한 표준 최적 경로입니다.
                   </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && routes.length === 0 && origin && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">물류 경로 최적화가 필요하시면 시뮬레이션 버튼을 눌러주세요.</p>
        </div>
      )}
    </div>
  );
}
