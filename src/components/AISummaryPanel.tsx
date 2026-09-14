import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  Lightbulb, 
  HeartHandshake,
  MessageCircle,
  HelpCircle,
  Smile,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AISpeechSummary, PredictionResult } from '../types';
import { EMOTIONS } from '../data/emotions';

interface AISummaryPanelProps {
  summary: AISpeechSummary | null;
  isLoading: boolean;
  prediction: PredictionResult | null;
  onRefresh?: () => void;
  isGeminiPowered?: boolean;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({
  summary,
  isLoading,
  prediction,
  isGeminiPowered = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  if (isLoading) {
    return (
      <div id="ai-summary-loading-panel" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Listening & Writing Easy Summary...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Finding the feeling in the voice and creating friendly advice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || !prediction) {
    return (
      <div id="ai-summary-empty-panel" className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-3 shadow-xs">
          <Smile className="w-6 h-6 text-indigo-500" />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Ready for Your Voice
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Record your voice or choose a sound above to see what feeling is detected and how to reply.
        </p>
      </div>
    );
  }

  const emotionKey = prediction.predicted_emotion?.toLowerCase() || 'neutral';
  const emotionMeta = EMOTIONS[emotionKey] || EMOTIONS.neutral;

  // Valence (-1 to 1) mapped to (0% to 100%)
  const valence = summary.circumplex?.valence ?? emotionMeta.valence;
  const arousal = summary.circumplex?.arousal ?? emotionMeta.arousal;
  const posX = Math.max(8, Math.min(92, ((valence + 1) / 2) * 100));
  const posY = Math.max(8, Math.min(92, (1 - arousal) * 100));

  const certaintyPercent = Math.round((prediction.confidence || 0) * 100);
  const certaintyLabel = 
    certaintyPercent >= 80 ? 'Very Sure' :
    certaintyPercent >= 55 ? 'Pretty Sure' : 'Mild Chance';

  const handleCopy = () => {
    const text = `Voice Emotion Check:
Emotion: ${emotionMeta.emoji} ${emotionMeta.simpleName} (${certaintyPercent}% sure)

What It Means:
${summary.summary}

Voice Tone:
${summary.prosody_analysis}

Daily Meaning:
${summary.conversational_context}

Helpful Tip:
${summary.recommended_action}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="ai-summary-active-panel" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              What This Voice Tells Us
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Easy explanation anyone can understand
            </p>
          </div>
        </div>

        <button
          id="btn-copy-ai-summary"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Main Hero Summary Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-850 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl" role="img" aria-label={emotionMeta.simpleName}>
                {emotionMeta.emoji}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {emotionMeta.simpleName} Voice
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    {certaintyLabel} ({certaintyPercent}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {emotionMeta.simpleDescription}
                </p>
              </div>
            </div>
          </div>

          <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
            "{summary.summary}"
          </p>
        </div>

        {/* 3 Simple Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tone */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Volume2 className="w-4 h-4" />
              <span>How The Voice Sounds</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {summary.prosody_analysis}
            </p>
          </div>

          {/* Card 2: Everyday Meaning */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>What It Usually Means</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
              {summary.conversational_context}
            </p>
          </div>

          {/* Card 3: Helpful Tip */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <HeartHandshake className="w-4 h-4" />
              <span>Best Way to Reply</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              {summary.recommended_action}
            </p>
          </div>
        </div>

        {/* Simple Voice Insights */}
        {summary.acoustic_insights && summary.acoustic_insights.length > 0 && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Quick Facts About This Voice</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {summary.acoustic_insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friendly Mood Map */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Voice Mood Map</span>
              </h4>
              <p className="text-xs text-slate-500">
                Shows if the voice is energetic or calm, and happy or upset
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {summary.circumplex?.description || emotionMeta.simpleName}
            </span>
          </div>

          {/* Simple 2D Box */}
          <div className="relative w-full h-44 bg-slate-900 rounded-xl p-3 overflow-hidden select-none border border-slate-800 text-slate-400">
            {/* 4 Quadrants in simple words */}
            <div className="absolute top-2 left-3 text-[11px] font-bold text-rose-300">
              Angry / Loud 😠
            </div>
            <div className="absolute top-2 right-3 text-[11px] font-bold text-emerald-300 text-right">
              Happy & Excited 😊
            </div>
            <div className="absolute bottom-2 left-3 text-[11px] font-bold text-blue-300">
              Sad & Quiet 😢
            </div>
            <div className="absolute bottom-2 right-3 text-[11px] font-bold text-slate-300 text-right">
              Calm & Peaceful 🍃
            </div>

            {/* Crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700/60" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-700/60" />

            {/* Moving Point */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
              style={{ left: `${posX}%`, top: `${posY}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl animate-bounce" role="img" aria-label="mood">
                  {emotionMeta.emoji}
                </span>
                <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-800 border border-slate-600 shadow-md">
                  This Voice
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Accordion for Technical Details */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showTechDetails ? 'Hide technical numbers' : 'Show technical sound numbers'}</span>
            </span>
            {showTechDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTechDetails && (
            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs space-y-2 text-slate-600 dark:text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Voice pitch estimate:</span>
                <span className="font-bold">{prediction.acoustic_features?.estimated_pitch_hz || 200} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Sound length:</span>
                <span className="font-bold">{prediction.audio_duration_sec || 2} seconds</span>
              </div>
              <div className="flex justify-between">
                <span>Sound loudness (RMS):</span>
                <span className="font-bold">{prediction.acoustic_features?.rms_energy || 0.02}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing method:</span>
                <span className="font-bold">{prediction.method || 'wav2vec2_ser'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
