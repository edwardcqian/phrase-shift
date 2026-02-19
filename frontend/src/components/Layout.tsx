import { Languages, History, Settings } from 'lucide-react';

export type Tab = 'translate' | 'review' | 'config';

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

const tabs: { key: Tab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'translate', label: 'Translate', Icon: Languages },
  { key: 'review', label: 'Review', Icon: History },
  { key: 'config', label: 'Config', Icon: Settings },
];

export default function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Languages size={22} className="text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">Phrase Shift</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium transition-colors cursor-pointer border-0 bg-transparent
                ${activeTab === key
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Icon size={20} className={activeTab === key ? 'text-indigo-600' : ''} />
              {label}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
