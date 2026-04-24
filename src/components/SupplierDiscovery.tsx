
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, ExternalLink, ShieldCheck, MapPin, Package, Database } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Supplier } from '../types';

export default function SupplierDiscovery() {
  const [commodity, setCommodity] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleSearch = async (kw?: string | React.MouseEvent) => {
    const query = typeof kw === 'string' ? kw : commodity;
    if (!query) return;
    setLoading(true);
    setSelectedNames([]);
    setComparisonData([]);
    setSelectedCountry('All');
    setCurrentPage(1);
    try {
      const data = await GeminiService.fetchSuppliers(query);
      setSuppliers(data);
      if (typeof kw === 'string') setCommodity(kw);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedNames.length < 2) return;
    setIsComparing(true);
    try {
      const targetSuppliers = suppliers.filter(s => selectedNames.includes(s.name)).map(s => ({
        name: s.name,
        country: s.country
      }));
      const comparison = await GeminiService.compareSuppliers(commodity, targetSuppliers);
      setComparisonData(comparison);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const toggleSelect = (name: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedNames(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, name];
    });
  };

  const availableCountries = ['All', ...new Set(suppliers.map(s => s.country))];
  const filteredSuppliers = selectedCountry === 'All' ? suppliers : suppliers.filter(s => s.country === selectedCountry);

  const totalItems = Math.min(filteredSuppliers.length, 30);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedSuppliers = filteredSuppliers.slice(0, 30).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const recommendedKeywords = ['유기농 아보카도', '냉동 대구', '의료용 실리콘', '산업용 로봇', '리튬이온 배터리'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="panel p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full text-left">
            <label className="text-sm lg:text-[15px] uppercase tracking-widest font-bold text-theme-text-muted mb-3 block text-left whitespace-nowrap">글로벌 공급 기업 발굴</label>
            <div className="relative group">
              <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-theme-accent transition-colors" size={20} />
              <input 
                type="text" 
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="찾으시는 품목을 입력하세요 (예: 유기농 아보카도, 냉동 대구...)"
                className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl pl-14 pr-6 py-4 text-theme-text-main font-sans focus:outline-none focus:border-theme-accent transition-all text-base lg:text-lg font-bold placeholder:text-slate-300 placeholder:font-normal"
              />
            </div>
            
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              <span className="text-xs lg:text-[13px] font-black text-theme-text-muted uppercase tracking-widest self-center mr-2 shrink-0 whitespace-nowrap">추천 검색어:</span>
              {recommendedKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => handleSearch(kw)}
                  className="px-4 py-2 bg-slate-100 hover:bg-theme-accent hover:text-white rounded-full text-[13px] lg:text-[14px] font-bold text-slate-500 transition-all shrink-0 whitespace-nowrap"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading || !commodity}
            className="w-full lg:w-auto h-[60px] px-10 bg-theme-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base lg:text-[18px] whitespace-nowrap shrink-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search size={20} />
                <span>공급선 찾기</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {suppliers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex flex-wrap items-center gap-3">
             <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hidden sm:flex">
                <MapPin size={16} /> 국가 필터:
             </span>
             {availableCountries.map(country => (
               <button
                 key={country}
                 onClick={() => {
                   setSelectedCountry(country);
                   setSelectedNames([]); // Reset selection when filtering changes
                 }}
                 className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                   selectedCountry === country 
                     ? 'bg-theme-accent text-white border-theme-accent'
                     : 'bg-white text-slate-500 border-slate-200 hover:border-theme-accent'
                 }`}
               >
                 {country === 'All' ? '전체' : country}
               </button>
             ))}
          </motion.div>
        )}
        
        {filteredSuppliers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-16 text-center">선택</th>
                    <th className="p-4 w-[25%] lg:w-[30%]">기업명</th>
                    <th className="p-4 w-24">국가</th>
                    <th className="p-4 w-[30%] lg:w-[35%]">핵심 품목</th>
                    <th className="p-4 w-24 text-center">신뢰도</th>
                    <th className="p-4 w-24 text-center">상태</th>
                    <th className="p-4 w-24 text-center">링크</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSuppliers.map((supplier, idx) => (
                    <tr 
                      key={`supplier-${idx}`}
                      onClick={() => supplier.website && window.open(supplier.website, '_blank')}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${selectedNames.includes(supplier.name) ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedNames.includes(supplier.name)}
                          onChange={(e) => toggleSelect(supplier.name, e)}
                          className="w-5 h-5 rounded border-slate-300 text-theme-accent focus:ring-theme-accent cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-theme-accent transition-colors" title={supplier.name}>
                          {supplier.name}
                        </div>
                        {supplier.reasoning && (
                          <div className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1" title={supplier.reasoning}>
                            {supplier.reasoning}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 truncate">
                          <MapPin size={12} className="shrink-0" /> {supplier.country}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 overflow-hidden">
                          {supplier.majorProducts.slice(0, 2).map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-600 whitespace-nowrap">{p}</span>
                          ))}
                          {supplier.majorProducts.length > 2 && (
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-500 whitespace-nowrap">+{supplier.majorProducts.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-mono font-bold text-slate-700 flex justify-center items-center gap-1">
                          <ShieldCheck size={14} className={supplier.reliabilityScore >= 80 ? 'text-emerald-500' : 'text-amber-500'} />
                          {supplier.reliabilityScore}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 flex justify-center w-full rounded text-[10px] font-black uppercase tracking-wider ${supplier.contactAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                          {supplier.contactAvailable ? 'Ready' : 'Verified'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (supplier.website) window.open(supplier.website, '_blank'); }}
                          className="p-1.5 text-slate-400 hover:text-theme-accent transition-colors bg-white hover:bg-theme-accent/5 rounded-lg inline-flex border border-slate-200"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-4 bg-slate-50/50">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-bold bg-white text-slate-600 hover:text-theme-accent hover:border-theme-accent disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors cursor-pointer"
                >
                  이전
                </button>
                <span className="text-sm font-bold text-slate-500">
                  {currentPage} <span className="text-slate-300 font-normal mx-1">/</span> {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-bold bg-white text-slate-600 hover:text-theme-accent hover:border-theme-accent disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors cursor-pointer"
                >
                  다음
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && suppliers.length === 0 && commodity && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <Package size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold">해당 품목의 공급 기업을 발굴하려면 검색 버튼을 눌러주세요.</p>
        </div>
      )}

      {/* Floating Action Bar for Comparison */}
      <AnimatePresence>
        {selectedNames.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 text-white max-w-[90vw]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-bold">
                {selectedNames.length}
              </div>
              <div>
                <p className="text-sm font-bold">공급선 비교하기 (최대 3개)</p>
                <p className="text-xs text-slate-400">선택된 기업들의 기본 거래 조건을 비교합니다.</p>
              </div>
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedNames.length < 2 || isComparing}
              className="px-6 py-2.5 bg-theme-accent hover:bg-blue-600 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isComparing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  비교 분석 중...
                </>
              ) : (
                '분석표 생성'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel overflow-hidden border-2 border-theme-accent shadow-xl shadow-blue-900/5"
        >
          <div className="panel-header bg-gradient-to-r from-theme-primary to-slate-800 text-white border-none py-5">
            선택된 공급선 거래 조건 심층 비교 분석
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-slate-50 border-b border-theme-border">
                <tr className="text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold w-48">비교 항목</th>
                  {comparisonData.map((data, idx) => (
                    <th key={`th-${data.supplierName}-${idx}`} className="px-6 py-4 font-bold min-w-[250px]">
                       <div className="text-theme-text-main text-base">{data.supplierName}</div>
                       <div className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1"><MapPin size={12}/> {data.country}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">예상 단가</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`price-${data.supplierName}-${idx}`} className="px-6 py-4">
                       <div className="font-mono font-bold text-theme-accent text-lg">{data.estimatedPrice}</div>
                       <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{data.pricingBasis}</div>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">신뢰도 점수</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`score-${data.supplierName}-${idx}`} className="px-6 py-4">
                       <div className="flex items-center gap-1.5">
                          <ShieldCheck size={16} className={data.reliabilityScore >= 80 ? "text-emerald-500" : "text-amber-500"} />
                          <span className={`font-mono font-bold ${data.reliabilityScore >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{data.reliabilityScore} / 100</span>
                       </div>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">최소 주문량 (MOQ)</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`moq-${data.supplierName}-${idx}`} className="px-6 py-4 font-bold text-theme-text-main">{data.moq}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">리드 타임</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`lead-${data.supplierName}-${idx}`} className="px-6 py-4 text-theme-text-main">{data.leadTime}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">결제 조건</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`payment-${data.supplierName}-${idx}`} className="px-6 py-4 text-theme-text-main">{data.paymentTerms}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600 bg-slate-50/50">주요 인증</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`cert-${data.supplierName}-${idx}`} className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                         {data.certifications}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-50/30 text-blue-900 border-t-2 border-blue-100">
                  <td className="px-6 py-4 font-bold bg-blue-50/50">장점 👍</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`pros-${data.supplierName}-${idx}`} className="px-6 py-4 font-medium leading-relaxed">{data.pros}</td>
                  ))}
                </tr>
                <tr className="bg-rose-50/30 text-rose-900">
                  <td className="px-6 py-4 font-bold bg-rose-50/50">단점/주의 ⚠️</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`cons-${data.supplierName}-${idx}`} className="px-6 py-4 font-medium leading-relaxed">{data.cons}</td>
                  ))}
                </tr>
                <tr className="bg-slate-100/50 text-slate-600">
                  <td className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest bg-slate-100/80">데이터 출처</td>
                  {comparisonData.map((data, idx) => (
                    <td key={`source-${data.supplierName}-${idx}`} className="px-6 py-4">
                       <span className="flex items-center gap-1.5 text-xs font-medium">
                          <Database size={12}/> {data.dataSource}
                       </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
