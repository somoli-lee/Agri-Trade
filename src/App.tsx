/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Header from './components/Header';
import FeasibilityDiagnosis from './components/FeasibilityDiagnosis';
import HSCodeGuide from './components/HSCodeGuide';
import LandedCostCalculator from './components/LandedCostCalculator';
import RiskDashboard from './components/RiskDashboard';
import MarketIntelligence from './components/MarketIntelligence';
import SupplierDiscovery from './components/SupplierDiscovery';
import LogisticsSimulator from './components/LogisticsSimulator';
import QuarantineRoadmap from './components/QuarantineRoadmap';

export default function App() {
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Try UNIPASS Customs Exchange Rate
        const uniResponse = await fetch('/api/unipass/exchange-rate');
        if (uniResponse.ok) {
          const uniData = await uniResponse.json();
          if (uniData.rate) {
            setExchangeRate(uniData.rate);
            console.log("Using UNIPASS Customs exchange rate");
          }
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate:", err);
      }
    };
    fetchRate();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'diagnosis':
        return <FeasibilityDiagnosis />;
      case 'hscode':
        return <HSCodeGuide />;
      case 'market':
        return <MarketIntelligence />;
      case 'supplier':
        return <SupplierDiscovery />;
      case 'logistics':
        return <LogisticsSimulator />;
      case 'quarantine':
        return <QuarantineRoadmap />;
      case 'cost':
        return <LandedCostCalculator />;
      case 'risk':
        return <RiskDashboard />;
      default:
        return <FeasibilityDiagnosis />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-theme-bg font-sans selection:bg-theme-accent selection:text-white">
      {/* Fixed Sidebar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
        {/* Top Intelligence Bar */}
        <div className="hidden lg:flex h-16 bg-white border-b border-theme-border items-center justify-between px-12 shrink-0">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">시장 상태</span>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="h-4 w-px bg-theme-border" />
              <p className="text-[11px] font-medium text-theme-text-main flex items-center gap-2">
                <span className="text-theme-text-muted uppercase font-bold">주간 관세고시환율 (UNIPASS):</span>
                <span className="text-theme-accent font-black">
                  {exchangeRate ? `USD/KRW ${exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '데이터 연동 중...'}
                </span>
              </p>
           </div>
           
           <div className="flex items-center gap-4 text-[11px] text-theme-text-muted font-bold uppercase tracking-widest">
              <span>2026년 4월 21일</span>
              <div className="w-8 h-8 rounded-full bg-theme-bg border border-theme-border flex items-center justify-center">
                 <Bell size={14} />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-12 px-4 sm:px-6 lg:px-12">
          {renderContent()}
        </div>

        {/* Footer info */}
        <footer className="py-8 border-t border-theme-border bg-white shadow-inner">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              © 2026 k-Agri-Trade 솔루션 v1.0.0
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}


