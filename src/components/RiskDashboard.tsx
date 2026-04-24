
import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Globe, Activity, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { RiskAlert } from '../types';

const mockAlerts: RiskAlert[] = [
  {
    id: '1',
    type: 'Disease',
    title: 'HPAI (고병원성 조류인플루엔자) 발생',
    region: '프랑스 (페이드라루아르)',
    date: '2026-04-18',
    severity: 'high',
    description: '해당 지역에서 생산된 가금류 및 가금육 가공품의 국내 수입 잠정 중단.'
  },
  {
    id: '2',
    type: 'NonCompliance',
    title: '잔류 농약 기준치 초과 검출',
    region: '태국 - 망고',
    date: '2026-04-10',
    severity: 'medium',
    description: '클로르피리포스 성분이 3회 연속 기준치 초과 검출됨에 따라 정밀 검사 대상으로 지정.'
  },
  {
    id: '3',
    type: 'Pest',
    title: '운송 중 과실파리 발견 건',
    region: '동남아시아 전역',
    date: '2026-04-05',
    severity: 'low',
    description: '하절기 기온 상승으로 인한 동남아산 열대과일류에 대한 무작위 샘플링 검사 비율 확대.'
  }
];

export default function RiskDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Risk Metrics */}
        <div className="lg:col-span-4 space-y-6">
           <div className="panel h-full">
              <div className="panel-header">지역별 위해도 인덱스</div>
              <div className="p-8 space-y-6">
                 {['유럽 및 지중해', '아시아 태평양', '북미 지역', '중남미 지역'].map((region, idx) => (
                   <div key={`risk-region-${idx}`} className="space-y-2">
                     <div className="flex justify-between items-center text-xs lg:text-sm font-bold uppercase tracking-tight text-theme-text-muted">
                        <span>{region}</span>
                        <span className={idx % 2 === 0 ? 'text-rose-500' : 'text-emerald-500'}>
                          {idx % 2 === 0 ? '위험' : '안전'}
                        </span>
                     </div>
                     <div className="w-full h-1.5 bg-theme-bg rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.random() * 60 + 30}%` }}
                        />
                     </div>
                   </div>
                 ))}
                 
                 <div className="pt-6 border-t border-theme-border">
                    <div className="bg-theme-primary text-white p-6 rounded-2xl relative overflow-hidden">
                       <ShieldAlert size={48} className="absolute right-[-10px] bottom-[-10px] opacity-10" />
                       <h5 className="text-xs lg:text-[13px] font-bold uppercase tracking-widest opacity-60 mb-3">검역 프로토콜 경보</h5>
                       <p className="font-serif italic text-lg lg:text-xl leading-relaxed mb-6">
                         "오세아니아산 모든 목재 포장재에 대해 의무 열처리 증명서 첨부가 의무화되었습니다."
                       </p>
                       <button className="text-xs lg:text-[14px] font-bold uppercase text-theme-accent hover:underline">상세 지침 다운로드</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-8">
           <div className="panel">
              <div className="panel-header">
                 실시간 규제 및 유입 경보 피드
                 <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] lg:text-xs font-bold rounded-full">
                      8건 심각
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] lg:text-xs font-bold rounded-full">
                      24건 주의
                    </span>
                 </div>
              </div>
              
              <div className="p-8 space-y-4">
                 {mockAlerts.map((alert, idx) => (
                   <motion.div
                     key={alert.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="group border border-theme-border p-5 rounded-2xl bg-theme-bg hover:bg-white hover:border-slate-300 transition-all flex gap-6"
                   >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        alert.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                     }`}>
                        {alert.severity === 'high' ? <AlertTriangle size={20} /> : <Info size={20} />}
                     </div>
                     
                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <span className="text-xs lg:text-[13px] font-bold uppercase tracking-wider text-theme-accent">
                                 {alert.type === 'Disease' ? '질병' : 
                                  alert.type === 'Pest' ? '해충' :
                                  alert.type === 'Regulation' ? '규제' : '부적합'}
                              </span>
                              <span className="text-[11px] lg:text-xs font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-theme-border italic">{alert.date}</span>
                           </div>
                           <span className="text-xs lg:text-[13px] font-bold text-slate-400">{alert.region}</span>
                        </div>
                        <h4 className="text-lg font-bold text-theme-text-main group-hover:text-theme-accent transition-colors">
                          {alert.title}
                        </h4>
                        <p className="text-sm lg:text-[15px] text-theme-text-muted leading-relaxed italic border-l-2 border-slate-200 pl-4 py-2">
                          "{alert.description}"
                        </p>
                     </div>
                   </motion.div>
                 ))}

                 <button className="w-full py-5 bg-white border border-dashed border-theme-border rounded-2xl text-xs lg:text-[14px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-theme-primary hover:border-slate-400 transition-all">
                    과거 리스크 데이터베이스 동기화
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

