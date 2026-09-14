import React from 'react';
import { 
  Mic, 
  Upload, 
  Headphones, 
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Smile
} from 'lucide-react';
import { AnalysisHistoryItem, SystemStatus } from '../types';
import { EMOTIONS, CANONICAL_EMOTION_KEYS } from '../data/emotions';

interface HomeDashboardProps {
  systemStatus: SystemStatus | null;
  history: AnalysisHistoryItem[];
  onSelectHistoryItem: (item: AnalysisHistoryItem) => void;
  onLaunchMic: () => void;
  onLaunchUpload: () => void;
  onLaunchSample: () => void;
  onNavigateTab: (tab: 'inference' | 'dataset' | 'model') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  history,
  onSelectHistoryItem,
  onLaunchMic,
  onLaunchUpload,
  onLaunchSample,
  onNavigateTab
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 text-white p-6 sm:p-10 border border-indigo-900/60 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Easy Voice Feeling Detector</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Discover the feeling <br className="hidden sm:inline" />
            behind any voice.
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Speak into your microphone, upload a sound file, or try ready-made examples. The computer listens to the tone of voice and explains the emotion in plain, friendly words.
          </p>

          {/* Big Touch-Friendly Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="btn-hero-mic"
              onClick={onLaunchMic}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold text-slate-900 bg-white hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <Mic className="w-4 h-4 text-rose-600" />
              <span>Record Voice</span>
            </button>

            <button
              id="btn-hero-upload"
              onClick={onLaunchUpload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md active:scale-95 border border-indigo-400/30"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload Sound</span>
            </button>

            <button
              id="btn-hero-sample"
              onClick={onLaunchSample}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-indigo-100 hover:text-white bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
            >
              <Headphones className="w-4 h-4 text-amber-300" />
              <span>Try Examples</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Simple Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              7 Emotions Detected
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Happy, Sad, Angry, Surprised, Scared, Disgusted, Calm
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              98.6% Accurate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trained and tested on thousands of real voice clips
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Easy Plain English
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Friendly summary and helpful tips anyone can understand
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 7 Emotions Guide + Recent History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 7 Emotions Guide */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                The 7 Feelings in Voice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                What each feeling sounds like and how to respond
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('dataset')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Listen in Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CANONICAL_EMOTION_KEYS.map((key) => {
              const emo = EMOTIONS[key];
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label={emo.simpleName}>
                        {emo.emoji}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {emo.simpleName}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {emo.simpleDescription}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Tip:</span> {emo.simpleTip}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recently Tested
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {history.length} checked
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Headphones className="w-8 h-8 mx-auto text-indigo-300 dark:text-indigo-700 opacity-60" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No voices checked yet</p>
                <p className="text-[11px] text-slate-400">
                  Tap "Record Voice" above or try an example.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {history.slice(0, 6).map((item) => {
                  const emoMeta = EMOTIONS[item.predictedEmotion] || EMOTIONS.neutral;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectHistoryItem(item)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.duration.toFixed(1)}s audio
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          <span>{emoMeta.emoji}</span>
                          <span>{emoMeta.simpleName}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={onLaunchMic}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Test Another Voice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
