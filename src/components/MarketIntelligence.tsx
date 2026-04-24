
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Globe, PieChart, Newspaper, Search, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { GeminiService } from '../services/geminiService';
import { MarketTrend } from '../types';

const COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Global cache to ensure identical results for same meaning keywords
const trendCache: Record<string, MarketTrend> = {};

const normalizeSearchKey = (keyword: string, period: string) => {
  return `${keyword.replace(/\s+/g, '').toLowerCase()}-${period}`;
};

export default function MarketIntelligence() {
  const [commodity, setCommodity] = useState('');
  const [period, setPeriod] = useState('6개월');
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<MarketTrend | null>(null);

  const handleFetch = async (selectedCommodity?: string | React.MouseEvent, selectedPeriod?: string) => {
    const targetCommodity = typeof selectedCommodity === 'string' ? selectedCommodity : commodity;
    const targetPeriod = typeof selectedPeriod === 'string' ? selectedPeriod : period;
    
    if (!targetCommodity) return;

    // Cache lookup for consistent result regardless of spacing
    const cacheKey = normalizeSearchKey(targetCommodity, targetPeriod);
    if (trendCache[cacheKey]) {
      setTrend(trendCache[cacheKey]);
      setCommodity(targetCommodity);
      return;
    }

    setLoading(true);
    try {
      const data = await GeminiService.fetchMarketTrends(targetCommodity, targetPeriod);
      trendCache[cacheKey] = data; // store in cache for subsequent identically-standardized queries
      setTrend(data);
      setCommodity(targetCommodity);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onPeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (trend) {
      handleFetch(commodity, newPeriod);
    }
  };

  const recommendedKeywords = ['냉동 망고', '베트남 커피원두', '호주산 소고기', '스테인리스강', '칠레산 와인'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Search Header */}
      <div className="panel p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full text-left">
            <label className="text-sm lg:text-[15px] uppercase tracking-widest font-bold text-theme-text-muted mb-3 block text-left whitespace-nowrap">품목별 시장 인텔리전스 조회</label>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-theme-accent transition-colors" size={20} />
              <input 
                type="text" 
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder="예: 망고, 커피원두, 스테인리스강..."
                className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-14 pr-6 py-4 text-theme-text-main font-sans focus:outline-none focus:border-theme-accent transition-all placeholder:text-slate-300 text-base lg:text-lg font-bold"
              />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              <span className="text-xs lg:text-[13px] font-black text-theme-text-muted uppercase tracking-widest self-center mr-2 shrink-0 whitespace-nowrap">추천 검색어:</span>
              {recommendedKeywords.map((kw, idx) => (
                <button
                  key={`${kw}-${idx}`}
                  onClick={() => handleFetch(kw)}
                  className="px-4 py-2 bg-slate-100 hover:bg-theme-accent hover:text-white rounded-full text-[13px] lg:text-[14px] font-bold text-slate-500 transition-all shrink-0 whitespace-nowrap"
                >
                  {kw}
                </button>
              ))}
            </div>
            
            {/* Standardization Guide */}
            <p className="mt-6 text-sm lg:text-[16px] leading-relaxed text-theme-accent/90 bg-blue-50/80 border border-blue-200 px-5 lg:px-6 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full xl:w-fit shadow-sm">
              <span className="font-bold text-theme-accent shrink-0 text-base lg:text-[17px] flex items-center gap-1.5 whitespace-nowrap">
                💡 검색 가이드:
              </span>
              <span>정확한 데이터 산출을 위해 '냉동 갈치'와 '냉동갈치' 등 띄어쓰기 <strong>및</strong> 단순 형태 변이는 내부적으로 통합되어 동일한 표준 시세를 반환합니다.</span>
            </p>
          </div>
          <button 
            onClick={handleFetch}
            disabled={loading || !commodity}
            className="w-full lg:w-auto h-[60px] px-10 bg-theme-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base lg:text-[18px] whitespace-nowrap shrink-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <TrendingUp size={20} />
                <span>데이터 시각화</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {trend && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Price Trend Chart */}
            <div className="lg:col-span-8">
              <div className="panel h-full flex flex-col">
                <div className="panel-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <span className="whitespace-nowrap">[{trend.commodity}] 글로벌 시세 변동 추이({period})</span>
                  <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                    {[
                      { label: '6개월', value: '1' },
                      { label: '1년', value: '12' },
                      { label: '5년', value: '60' }
                    ].map((p, idx) => (
                      <button
                        key={`${p.value}-${idx}`}
                        onClick={() => onPeriodChange(p.label)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${
                          period === p.label 
                            ? 'bg-white text-theme-primary shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-8 min-h-[400px] flex flex-col">
                  <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-theme-bg border border-theme-border text-theme-text-main text-[11px] font-bold rounded-full">
                      기준: <span className="text-theme-accent">{trend.currency} / {trend.unit}</span>
                    </span>
                    {trend.dataSource && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs lg:text-[13px] font-bold rounded flex-wrap">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-emerald-600/80">데이터 출처:</span> {trend.dataSource}
                      </span>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trend.priceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        tickFormatter={(value) => `${value}`}
                        width={60}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toLocaleString()} ${trend.currency} / ${trend.unit}`, '평균 시세']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-4 flex flex-col gap-3">
                     <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <h4 className="flex items-center gap-2 text-[13px] lg:text-[14px] font-bold text-blue-900 uppercase tracking-widest mb-2">
                           💡 가격 분석 인사이트
                        </h4>
                        <p className="text-sm lg:text-[15px] text-blue-800 leading-relaxed font-medium">
                           {trend.priceAnalysis}
                        </p>
                     </div>
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <h4 className="flex items-center gap-2 text-[13px] lg:text-[14px] font-bold text-amber-900 uppercase tracking-widest mb-2">
                           📅 연간 계절성 (Seasonality)
                        </h4>
                        <div className="space-y-2 mt-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[13px] lg:text-sm font-bold text-amber-800">🔺 주로 상승하는 시기:</span>
                              <span className="text-[13px] lg:text-sm font-bold text-rose-600 bg-white/60 px-2 py-0.5 rounded">{trend.seasonality?.highSeason || '-'}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[13px] lg:text-sm font-bold text-amber-800">🔽 주로 하락하는 시기:</span>
                              <span className="text-[13px] lg:text-sm font-bold text-emerald-600 bg-white/60 px-2 py-0.5 rounded">{trend.seasonality?.lowSeason || '-'}</span>
                           </div>
                           <p className="text-sm lg:text-[15px] text-amber-800 leading-relaxed font-medium mt-3 pt-3 border-t border-amber-200/50">
                              {trend.seasonality?.reasoning}
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Share */}
            <div className="lg:col-span-4">
              <div className="panel h-full flex flex-col">
                <div className="panel-header">주요 국가별 공급 점유율 (Share of Supply)</div>
                <div className="flex-1 p-6 flex flex-col">
                   <div className="h-[140px] mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend.marketShare} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: -20 }}>
                           <XAxis type="number" hide />
                           <YAxis dataKey="country" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700' }} width={70} />
                           <Tooltip cursor={{ fill: 'transparent' }} />
                           <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                              {trend.marketShare.map((_, index) => (
                                <Cell key={`cell-share-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-1">
                      {trend.marketShare.map((item, idx) => (
                        <div key={`share-item-${item.country}-${idx}`} className="flex justify-between items-center text-sm lg:text-[13px] py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="font-bold">{item.country}</span>
                           </div>
                           <span className="font-mono font-bold text-slate-500">{item.value}%</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* News Feed */}
            <div className="lg:col-span-12">
               <div className="panel">
                  <div className="panel-header flex items-center gap-2">
                     <Newspaper size={16} className="text-theme-accent" />
                     <span>품목 관련 실시간 뉴스 & 정책 동향</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-theme-border">
                     {trend.news.map((n, i) => (
                        <div key={`news-${i}`} className="p-8 hover:bg-slate-50 transition-all cursor-pointer group">
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest">{n.source}</span>
                              <span className="text-[10px] text-slate-400">{n.date}</span>
                           </div>
                           <h4 className="text-sm font-bold text-theme-text-main group-hover:text-theme-accent transition-colors leading-snug mb-4">
                              {n.title}
                           </h4>
                           <div className="flex items-center gap-2 text-theme-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                              <span className="text-[10px] font-black">READ MORE</span>
                              <ArrowUpRight size={14} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
