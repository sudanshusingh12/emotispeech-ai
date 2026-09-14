import React from 'react';
import { 
  Smile, 
  Mic, 
  Upload, 
  Home, 
  Radio, 
  Headphones, 
  HelpCircle 
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'inference' | 'dataset' | 'model';
  setActiveTab: (tab: 'dashboard' | 'inference' | 'dataset' | 'model') => void;
  onQuickMic: () => void;
  onQuickUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickMic,
  onQuickUpload
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => setActiveTab('dashboard')}
            title="Go to Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Voice Emotion <span className="text-indigo-600 dark:text-indigo-400">Detector</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Listen to feelings in any voice
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              id="nav-tab-inference"
              onClick={() => setActiveTab('inference')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'inference'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Check Voice</span>
            </button>

            <button
              id="nav-tab-dataset"
              onClick={() => setActiveTab('dataset')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dataset'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Voice Library</span>
            </button>

            <button
              id="nav-tab-model"
              onClick={() => setActiveTab('model')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'model'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>How It Works</span>
            </button>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-header-mic"
              onClick={onQuickMic}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Record Voice</span>
              <span className="sm:hidden">Record</span>
            </button>

            <button
              id="btn-header-upload"
              onClick={onQuickUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs shadow-indigo-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Sound</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="grid grid-cols-4 md:hidden py-1.5 border-t border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg font-bold min-h-[44px] ${
              activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('inference')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg font-bold min-h-[44px] ${
              activeTab === 'inference' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            <Radio className="w-4 h-4 mb-0.5" />
            <span>Check</span>
          </button>

          <button
            onClick={() => setActiveTab('dataset')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg font-bold min-h-[44px] ${
              activeTab === 'dataset' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            <Headphones className="w-4 h-4 mb-0.5" />
            <span>Library</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg font-bold min-h-[44px] ${
              activeTab === 'model' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            <HelpCircle className="w-4 h-4 mb-0.5" />
            <span>How It Works</span>
          </button>
        </div>
      </div>
    </header>
  );
};
