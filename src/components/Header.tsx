
import React, { useState } from 'react';
import { Package, Search, Calculator, ShieldAlert, BookOpen, Menu, Bell, TrendingUp, Users, Ship, X, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavItemProps {
  key?: string | number;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 w-full transition-all relative ${
      active
        ? 'bg-white/10 text-white'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
    {icon}
    <span className="font-semibold text-sm tracking-tight">{label}</span>
  </button>
);

export default function Header({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'diagnosis', icon: <Search size={18} />, label: '수입 가능성 진단' },
    { id: 'hscode', icon: <BookOpen size={18} />, label: 'HS Code 가이드' },
    { id: 'market', icon: <TrendingUp size={18} />, label: '시장 인텔리전스' },
    { id: 'supplier', icon: <Users size={18} />, label: '글로벌 공급선 탐색' },
    { id: 'logistics', icon: <Ship size={18} />, label: '물류 경로 시뮬레이터' },
    { id: 'quarantine', icon: <ClipboardCheck size={18} />, label: '자동 검역 로드맵' },
    { id: 'cost', icon: <Calculator size={18} />, label: 'Landed Cost 계산기' },
    { id: 'risk', icon: <ShieldAlert size={18} />, label: '위험 레이더' },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-theme-primary px-4 flex items-center justify-between z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-theme-accent rounded-lg flex items-center justify-center">
            <Package className="text-white w-5 h-5" />
          </div>
          <h1 className="font-extrabold text-lg tracking-tight text-white">k-Agri-Trade</h1>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar / Drawer Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-theme-primary z-[70] lg:hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="text-theme-accent" size={24} />
                <span className="font-bold text-white">k-Agri-Trade</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 p-2">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 mt-4">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                />
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex w-72 bg-theme-primary h-screen sticky top-0 flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-theme-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="text-white w-6 h-6" />
            </div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">k-Agri-Trade</h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-2">Agri-Trade 대시보드</p>
        </div>

        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => handleTabClick(item.id)}
            />
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-white/10">
              LA
            </div>
            <div>
              <p className="text-xs font-bold text-white">Lee Andrew</p>
              <p className="text-[10px] text-slate-400 font-medium">관리자</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

