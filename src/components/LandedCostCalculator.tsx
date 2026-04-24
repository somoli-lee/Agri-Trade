
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, DollarSign, Wallet, Percent, ArrowRight, Table, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LandedCost } from '../types';

const CHART_COLORS = ['#334155', '#3b82f6', '#10b981', '#f59e0b'];

export default function LandedCostCalculator() {
  const [fob, setFob] = useState(10000);
  const [freight, setFreight] = useState(1500);
  const [insurance, setInsurance] = useState(100);
  const [dutyRate, setDutyRate] = useState(8);
  const [exchangeRate, setExchangeRate] = useState(1324.50); 
  
  const [costs, setCosts] = useState<LandedCost | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/unipass/exchange-rate');
        const data = await response.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate:", err);
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const cif = fob + freight + insurance;
    const cifKrw = cif * exchangeRate;
    const duty = cifKrw * (dutyRate / 100);
    const vatBase = cifKrw + duty;
    const vat = vatBase * 0.1;
    const feesRaw = (cifKrw * 0.002);
    const quarantineFee = feesRaw * 0.3;
    const warehouseFee = feesRaw * 0.7;
    
    setCosts({
      fob,
      freight,
      insurance,
      cifKrw,
      customsDuty: duty,
      vat,
      quarantineFee,
      warehouseFee,
      total: cifKrw + duty + vat + feesRaw,
      exchangeRate
    });
  }, [fob, freight, insurance, dutyRate, exchangeRate]);

  const chartData = costs ? [
    { name: '물류지 가격 (CIF)', value: costs.cifKrw },
    { name: '관세', value: costs.customsDuty },
    { name: '부가가치세', value: costs.vat },
    { name: '기타 부대비용', value: costs.quarantineFee + costs.warehouseFee }
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-2">
         {/* Config Panel */}
         <div className="w-full lg:w-[35%] xl:w-[30%] space-y-6 flex flex-col">
            <div className="panel overflow-visible flex-1 flex flex-col">
               <div className="panel-header">재무 파라미터 구성 (USD)</div>
               <div className="p-8 space-y-6 flex-1">
                  <div>
                    <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">물품 순 가격 (FOB)</label>
                    <div className="relative group">
                      <input
                        type="number"
                        value={fob}
                        onChange={(e) => setFob(Number(e.target.value))}
                        className="w-full bg-theme-bg border border-theme-border pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono text-sm lg:text-base group-hover:border-slate-300 transition-all font-bold"
                      />
                      <span className="absolute right-4 top-3.5 font-bold text-slate-300">$</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">운송비 (Freight)</label>
                      <input
                        type="number"
                        value={freight}
                        onChange={(e) => setFreight(Number(e.target.value))}
                        className="w-full bg-theme-bg border border-theme-border px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono text-sm lg:text-base font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">보험료 (Insurance)</label>
                      <input
                        type="number"
                        value={insurance}
                        onChange={(e) => setInsurance(Number(e.target.value))}
                        className="w-full bg-theme-bg border border-theme-border px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono text-sm lg:text-base font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs lg:text-[13px] uppercase tracking-wider font-bold text-theme-text-muted mb-2 block">적용 관세율 (%)</label>
                      <input
                        type="number"
                        value={dutyRate}
                        onChange={(e) => setDutyRate(Number(e.target.value))}
                        className="w-full bg-theme-bg border border-theme-border px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono text-sm lg:text-base font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-theme-border">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl relative group">
                      <div>
                        <div className="text-[10px] lg:text-xs uppercase font-bold text-emerald-900/40 tracking-wider flex items-center gap-1">
                          주간 관세고시환율 (UNIPASS)
                          <div className="group-hover:block hidden absolute bottom-full left-0 mb-2 p-3 bg-slate-800 text-white text-[10px] lg:text-xs rounded w-52 z-20 shadow-xl font-normal leading-relaxed">
                            관세청에서 매주 금요일 공고하여 다음 일요일부터 토요일까지 적용되는 수입 신고용 법정 환율입니다.
                          </div>
                        </div>
                        <p className="text-sm lg:text-base font-bold text-emerald-900">₩ {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-1 rounded">USD/KRW</span>
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Results Panel */}
         <div className="w-full lg:w-[65%] xl:w-[70%] flex flex-col">
            <div className="panel flex-1 flex flex-col overflow-hidden shadow-sm">
               <div className="px-6 lg:px-8 py-5 border-b border-theme-border flex justify-between items-center bg-slate-50/50">
                  <span className="text-xs lg:text-sm font-bold uppercase tracking-widest text-theme-text-muted">비용 시뮬레이션 결과 (Landed Cost Analysis)</span>
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
               </div>

               <div className="p-6 lg:p-8 flex-1 flex flex-col">
                  {/* Total Highlight */}
                  <div className="mb-6 lg:mb-8 text-left border-b border-theme-border pb-5 lg:pb-6">
                     <p className="text-sm lg:text-[13px] uppercase tracking-[0.2em] font-bold text-theme-accent mb-2">총 수입 원가 (Total)</p>
                     <h3 className="text-4xl lg:text-6xl font-mono tracking-tighter leading-none break-all text-theme-text-main font-black">
                        ₩{costs?.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                     </h3>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                     {/* Breakdown List (Left Side on Desktop, Bottom on Mobile) */}
                     <div className="order-2 lg:order-1 flex flex-col gap-3 lg:gap-4">
                        {[
                           { label: '물품 수입원가 (CIF)', value: costs?.cifKrw, color: CHART_COLORS[0] },
                           { label: '관세 (Customs Duty)', value: costs?.customsDuty, color: CHART_COLORS[1] },
                           { label: '부가가치세 (VAT)', value: costs?.vat, color: CHART_COLORS[2] },
                           { label: '기타 부대비용', value: (costs?.quarantineFee || 0) + (costs?.warehouseFee || 0), color: CHART_COLORS[3] }
                        ].map((item, idx) => (
                           <div key={`cost-item-${idx}`} className="flex flex-col items-start justify-center border-b border-theme-border/50 pb-3 gap-1">
                              <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-md shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                                 <p className="text-xs lg:text-[13px] font-bold text-theme-text-main tracking-wide">{item.label}</p>
                              </div>
                              <p className="text-lg lg:text-xl font-mono font-black tracking-tight text-theme-text-main pl-[24px]">
                                 ₩{item.value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </p>
                           </div>
                        ))}
                     </div>

                     {/* Visualization (Right Side on Desktop, Top on Mobile) */}
                     <div className="relative order-1 lg:order-2 h-[220px] sm:h-[280px] lg:h-full lg:min-h-[300px] flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                           <div className="text-center">
                              <p className="text-[10px] font-bold text-theme-text-muted uppercase">Cost Mix</p>
                              <p className="text-xs lg:text-sm font-mono font-bold text-theme-accent">BREAKDOWN</p>
                           </div>
                        </div>
                        <div className="w-full h-full absolute inset-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="65%"
                                    outerRadius="90%"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                 >
                                    {chartData.map((entry, index) => (
                                    <Cell key={`cost-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip 
                                    contentStyle={{ 
                                       backgroundColor: '#0f172a', 
                                       border: '1px solid rgba(255,255,255,0.1)', 
                                       borderRadius: '12px',
                                       fontSize: '11px',
                                       fontFamily: 'monospace'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => `₩${value.toLocaleString()}`}
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-100/50 border-t border-theme-border flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-6 text-[10px] lg:text-xs font-bold text-theme-text-muted">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border border-theme-text-muted/30" />
                        <span>FOB 가격: USD {fob.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border border-theme-text-muted/30" />
                        <span>환율 기준: {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                  </div>
                  
                  {/* Calculation Logic Explanation */}
                  <div className="w-full text-xs text-theme-text-muted/80 bg-white p-4 rounded-xl border border-theme-border mt-2 space-y-2 leading-relaxed max-w-4xl shadow-sm">
                     <p className="font-bold text-theme-text-main text-sm mb-3">계산 로직 안내 (Landed Cost Formula)</p>
                     <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] lg:text-xs mb-3">
                        <li><strong>물품 수입원가 (CIF):</strong> (FOB + 운송비 + 보험료) × 과세환율(USD/KRW)</li>
                        <li><strong>관세 (Customs Duty):</strong> CIF × 적용 관세율(%)</li>
                        <li><strong>부가가치세 (VAT):</strong> (CIF + 관세) × 10%</li>
                        <li><strong>기타 부대비용:</strong> 창고료(보관료 등) 및 검역수수료 등 실비 정산</li>
                        <li><strong>총 수입 원가 (Total):</strong> CIF + 관세 + 부가가치세 + 기타 부대비용</li>
                     </ul>
                     <p className="text-[10px] lg:text-[11px] italic mt-2 text-theme-accent">* 본 계산기는 관세청 주간 고시환율을 실시간으로 반영하여 추정한 시뮬레이션 결과이며, 실제 통관 시 발생하는 부대비용 및 적용 환율에 따라 최종 금액은 변동될 수 있습니다.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

