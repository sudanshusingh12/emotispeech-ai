import React, { useState } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  ArrowRight,
  Sparkles,
  Smile,
  Users
} from 'lucide-react';
import { SampleAudio } from '../types';
import { EMOTIONS, CANONICAL_EMOTION_KEYS } from '../data/emotions';

interface DatasetExplorerProps {
  samples: SampleAudio[];
  onSelectSample: (sample: SampleAudio) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  samples,
  onSelectSample
}) => {
  const [activeSpeaker, setActiveSpeaker] = useState<'all' | 'OAF' | 'YAF'>('all');
  const [activeEmotion, setActiveEmotion] = useState<string>('all');
  const [playingSampleUrl, setPlayingSampleUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleSampleAudio = (url: string) => {
    if (playingSampleUrl === url) {
      audioRef.current?.pause();
      setPlayingSampleUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(console.error);
        setPlayingSampleUrl(url);
      }
    }
  };

  const filteredSamples = samples.filter((s) => {
    const matchSpeaker = activeSpeaker === 'all' || s.speaker === activeSpeaker;
    const matchEmotion = activeEmotion === 'all' || s.emotion === activeEmotion;
    return matchSpeaker && matchEmotion;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingSampleUrl(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-600" />
            <span>Voice Library</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Listen to 2,800 real practice voice recordings across all 7 feelings
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            2,800 Voice Clips
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">
            Equal Practice for Each Feeling
          </span>
        </div>
      </div>

      {/* 3 Simple Explanatory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Equal Feelings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Smile className="w-4 h-4 text-indigo-500" />
            <span>400 Clips Per Feeling</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            The computer was taught with exactly 400 recordings of every feeling so it stays fair and balanced.
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {CANONICAL_EMOTION_KEYS.map((key) => {
              const emo = EMOTIONS[key];
              return (
                <div key={key} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <span>{emo.emoji}</span>
                    <span>{emo.simpleName}</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">400</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Speakers Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Two Real Voices</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Recorded by two native English speakers so the system learns both deeper and higher pitched voices.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Older Voice (Age 64)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Deeper tone with steady cadence (1,400 clips)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Younger Voice (Age 26)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Higher tone with lively bounce (1,400 clips)
              </p>
            </div>
          </div>
        </div>

        {/* Clear Recording Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>How Recordings Sound</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Each person said everyday words starting with the phrase: "Say the word..." in different feelings.
          </p>

          <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span>Different Words:</span>
              <span className="font-bold">200 common words</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span>Clip Length:</span>
              <span className="font-bold">About 2 seconds each</span>
            </div>
            <div className="flex justify-between">
              <span>Studio Quality:</span>
              <span className="font-bold text-emerald-600">Crystal Clear Audio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sound Browser */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Listen to Voice Examples
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Press play to hear the voice, or tap "Check This Voice" to test it
            </p>
          </div>

          {/* Easy Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={activeEmotion}
              onChange={(e) => setActiveEmotion(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Feelings</option>
              {CANONICAL_EMOTION_KEYS.map((k) => {
                const emo = EMOTIONS[k];
                return (
                  <option key={k} value={k}>
                    {emo.emoji} {emo.simpleName}
                  </option>
                );
              })}
            </select>

            <select
              value={activeSpeaker}
              onChange={(e) => setActiveSpeaker(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Speakers</option>
              <option value="OAF">Older Voice</option>
              <option value="YAF">Younger Voice</option>
            </select>
          </div>
        </div>

        {/* Voice Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredSamples.slice(0, 30).map((sample, idx) => {
            const emo = EMOTIONS[sample.emotion] || EMOTIONS.neutral;
            const isAuditioning = playingSampleUrl === sample.url;

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => toggleSampleAudio(sample.url)}
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all ${
                      isAuditioning
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:scale-105'
                    }`}
                    title={isAuditioning ? "Pause" : "Play"}
                  >
                    {isAuditioning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      "{sample.word}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {sample.speaker === 'OAF' ? 'Older Voice' : 'Younger Voice'} • {sample.duration}s
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    style={{ backgroundColor: `${emo.color}15`, color: emo.color }}
                  >
                    <span>{emo.emoji}</span>
                    <span className="hidden sm:inline">{emo.simpleName}</span>
                  </span>

                  <button
                    onClick={() => onSelectSample(sample)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-colors shadow-2xs text-xs font-semibold flex items-center gap-1"
                    title="Check feeling with this voice"
                  >
                    <span>Check</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
