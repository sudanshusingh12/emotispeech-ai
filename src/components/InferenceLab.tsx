import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  Sparkles, 
  Volume2, 
  Headphones, 
  AlertCircle, 
  RefreshCw,
  FileCheck,
  Check
} from 'lucide-react';
import { 
  SampleAudio, 
  PredictionResult, 
  AISpeechSummary, 
  AnalysisHistoryItem 
} from '../types';
import { EMOTIONS, CANONICAL_EMOTION_KEYS } from '../data/emotions';
import { AISummaryPanel } from './AISummaryPanel';

interface InferenceLabProps {
  samples: SampleAudio[];
  initialMode?: 'mic' | 'upload' | 'sample';
  onNewHistoryItem: (item: AnalysisHistoryItem) => void;
}

export const InferenceLab: React.FC<InferenceLabProps> = ({
  samples,
  initialMode = 'mic',
  onNewHistoryItem
}) => {
  // Input mode tab: 'mic' | 'upload' | 'sample'
  const [inputMode, setInputMode] = useState<'mic' | 'upload' | 'sample'>(initialMode);

  // Audio state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string>('No voice chosen yet');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample browser state
  const [filterEmotion, setFilterEmotion] = useState<string>('all');

  // Prediction & AI Summary State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [aiSummary, setAiSummary] = useState<AISpeechSummary | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGeminiPowered, setIsGeminiPowered] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // HTML Audio element ref
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialMode) {
      setInputMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (samples.length > 0 && !currentAudioUrl && inputMode === 'sample') {
      loadSample(samples[0]);
    }
  }, [samples, inputMode]);

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      const cur = audioPlayerRef.current.currentTime;
      const dur = audioPlayerRef.current.duration || 1;
      setCurrentTime(cur);
      setPlaybackProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      setAudioDuration(audioPlayerRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentTime(0);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  // --- Microphone Handlers ---
  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlob);
        setCurrentAudioUrl(localUrl);
        setAudioTitle(`My Voice (${new Date().toLocaleTimeString()})`);
        setCurrentAudioPath(null);

        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          setAudioBase64(b64);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 6) {
            stopRecording();
            return 6;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access issue:', err);
      setMicError('Could not use the microphone. Please click "Allow" if your browser asks for microphone permission.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --- File Upload Handlers ---
  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(wav|mp3|ogg|webm|m4a|flac)$/i)) {
      setAnalysisError('Please choose a sound file (like .mp3, .wav, or .m4a).');
      return;
    }

    setAnalysisError(null);
    setUploadedFileName(file.name);
    setAudioTitle(file.name);
    setCurrentAudioPath(null);

    const localUrl = URL.createObjectURL(file);
    setCurrentAudioUrl(localUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- Sample Selector Handler ---
  const loadSample = (sample: SampleAudio) => {
    setCurrentAudioUrl(sample.url);
    setCurrentAudioPath(sample.file_path);
    setAudioBase64(null);
    const emoMeta = EMOTIONS[sample.emotion] || EMOTIONS.neutral;
    setAudioTitle(`"${sample.word}" (${emoMeta.emoji} ${emoMeta.simpleName})`);
    setUploadedFileName(null);
    setPrediction(null);
    setAiSummary(null);
  };

  // --- Run Inference & AI Speech Summary ---
  const executeAnalysis = async () => {
    if (!currentAudioPath && !audioBase64) {
      setAnalysisError('Please record your voice, upload a sound, or pick an example first.');
      return;
    }

    setIsAnalyzing(true);
    setIsAiLoading(true);
    setAnalysisError(null);

    try {
      const payload: any = {};
      if (audioBase64) {
        payload.audioBase64 = audioBase64;
      } else if (currentAudioPath) {
        payload.audioPath = currentAudioPath;
      }

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Could not analyze voice');
      }

      const predResult: PredictionResult = await res.json();
      setPrediction(predResult);

      if (predResult.audioUrl) {
        setCurrentAudioUrl(predResult.audioUrl);
      }

      onNewHistoryItem({
        id: `analysis_${Date.now()}`,
        timestamp: Date.now(),
        source: inputMode,
        title: audioTitle,
        predictedEmotion: predResult.predicted_emotion,
        confidence: predResult.confidence,
        duration: predResult.audio_duration_sec || audioDuration || 2.0,
        audioUrl: predResult.audioUrl || currentAudioUrl || undefined
      });

      setIsAnalyzing(false);

      // Query AI Speech Summary Panel
      try {
        const summaryRes = await fetch('/api/gemini/speech-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            predictedEmotion: predResult.predicted_emotion,
            confidence: predResult.confidence,
            probabilities: predResult.probabilities,
            acousticFeatures: predResult.acoustic_features || {},
            audioMeta: {
              title: audioTitle,
              source: inputMode,
              samplingRate: predResult.sampling_rate
            }
          })
        });

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setAiSummary(summaryData.aiSummary);
          setIsGeminiPowered(Boolean(summaryData.isGeminiPowered));
        }
      } catch (sumErr) {
        console.warn('AI Summary note:', sumErr);
      } finally {
        setIsAiLoading(false);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError('We had trouble analyzing this sound. Please try recording or uploading again.');
      setIsAnalyzing(false);
      setIsAiLoading(false);
    }
  };

  const filteredSamples = samples.filter((s) => {
    return filterEmotion === 'all' || s.emotion.toLowerCase() === filterEmotion.toLowerCase();
  });

  const predictedMeta = prediction ? (EMOTIONS[prediction.predicted_emotion] || EMOTIONS.neutral) : null;
  const confidencePercent = prediction ? Math.round(prediction.confidence * 100) : 0;
  const confidenceText = 
    confidencePercent >= 80 ? 'Very Sure' :
    confidencePercent >= 55 ? 'Pretty Sure' : 'Mild Chance';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hidden Audio Player */}
      <audio
        ref={audioPlayerRef}
        src={currentAudioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Page Heading & Simple Instructions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Check Voice Emotion</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Listen to any voice and find out the feeling in simple words
            </p>
          </div>
        </div>

        {/* 3 Step Pill Tracker */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-semibold text-center select-none">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span>1. Pick or Record Voice</span>
          </div>
          <div className={`p-2 rounded-xl border ${currentAudioUrl ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            <span>2. Tap Check Emotion</span>
          </div>
          <div className={`p-2 rounded-xl border ${prediction ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            <span>3. Read Friendly Advice</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Voice Input (Mic, Upload, Sample) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            {/* 3 Source Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Choose How to Listen
              </h2>

              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  id="tab-mode-mic"
                  onClick={() => setInputMode('mic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    inputMode === 'mic'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-rose-500" />
                  <span>Record</span>
                </button>

                <button
                  id="tab-mode-upload"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Upload</span>
                </button>

                <button
                  id="tab-mode-sample"
                  onClick={() => setInputMode('sample')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    inputMode === 'sample'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-amber-500" />
                  <span>Examples</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Microphone */}
            {inputMode === 'mic' && (
              <div className="space-y-4 pt-1">
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-center">
                  <div className="relative mb-4">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-8 ring-rose-500/20 animate-pulse'
                          : 'bg-white dark:bg-slate-800 text-rose-600 border-2 border-rose-200 dark:border-rose-900/60 hover:scale-105 shadow-sm'
                      }`}
                      title={isRecording ? "Tap to stop" : "Tap to record"}
                    >
                      {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-9 h-9" />}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isRecording ? `Listening... (${recordSeconds}s of 6s)` : 'Tap Button to Record Voice'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {isRecording
                      ? 'Speak normally into your microphone now...'
                      : 'Say something like "I am very happy today" or "What is going on?"'}
                  </p>

                  <div className="mt-4">
                    {!isRecording ? (
                      <button
                        id="btn-start-mic-record"
                        onClick={startRecording}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all active:scale-95"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Speaking</span>
                      </button>
                    ) : (
                      <button
                        id="btn-stop-mic-record"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95"
                      >
                        <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                        <span>Done Speaking</span>
                      </button>
                    )}
                  </div>

                  {micError && (
                    <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                      {micError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Upload File */}
            {inputMode === 'upload' && (
              <div className="space-y-4 pt-1">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-850/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tap to Choose Sound File
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Supports recordings from your phone or computer (.wav, .mp3, .m4a)
                  </p>
                </div>

                {uploadedFileName && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{uploadedFileName}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">Loaded</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Sample Voice Library */}
            {inputMode === 'sample' && (
              <div className="space-y-3 pt-1">
                {/* Filter Pills with Emojis */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    onClick={() => setFilterEmotion('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterEmotion === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    All Voices
                  </button>
                  {CANONICAL_EMOTION_KEYS.map((key) => {
                    const emo = EMOTIONS[key];
                    const isSelected = filterEmotion === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilterEmotion(key)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <span>{emo.emoji}</span>
                        <span>{emo.simpleName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sample Grid */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredSamples.slice(0, 12).map((sample, idx) => {
                    const isSelected = currentAudioPath === sample.file_path;
                    const emo = EMOTIONS[sample.emotion] || EMOTIONS.neutral;
                    return (
                      <div
                        key={idx}
                        onClick={() => loadSample(sample)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50/40 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl" role="img" aria-label={emo.simpleName}>
                            {emo.emoji}
                          </span>
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold">
                              "{sample.word}"
                            </span>
                            <span className="text-slate-400 ml-1.5 text-[11px]">
                              ({sample.speaker === 'OAF' ? 'Older Voice' : 'Younger Voice'})
                            </span>
                          </div>
                        </div>

                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                          style={{ backgroundColor: `${emo.color}15`, color: emo.color }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{emo.simpleName}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audio Player & Check Emotion Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {audioTitle}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {currentTime.toFixed(1)}s / {audioDuration ? `${audioDuration.toFixed(1)}s` : '0.0s'}
                </span>
              </div>

              {/* Waveform Player Bar */}
              <div className="relative w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center px-2">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-indigo-500/20 border-r-2 border-indigo-600 transition-all"
                  style={{ width: `${playbackProgress}%` }}
                />

                <div className="relative z-10 flex items-center justify-between w-full px-1">
                  <button
                    id="btn-toggle-playback"
                    onClick={togglePlayback}
                    disabled={!currentAudioUrl}
                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:bg-slate-50 shadow-xs disabled:opacity-40"
                    title={isPlaying ? "Pause voice" : "Play voice"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isPlaying ? 'Playing...' : 'Press play to listen'}
                  </span>
                </div>
              </div>

              {/* Big Primary Action Button */}
              <button
                id="btn-analyze-speech"
                onClick={executeAnalysis}
                disabled={isAnalyzing || (!currentAudioPath && !audioBase64)}
                className="w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Listening & Finding Emotion...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Check Voice Emotion</span>
                  </>
                )}
              </button>

              {analysisError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detected Emotion Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Voice Emotion Result
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  What feelings were found in the voice
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {prediction ? 'Finished' : 'Waiting'}
              </span>
            </div>

            {!prediction ? (
              <div className="py-14 text-center text-slate-400 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto opacity-30 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Ready to Listen
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Pick or record a voice on the left, then tap "Check Voice Emotion".
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Main Emotion Card */}
                <div
                  className="p-5 rounded-2xl border transition-all space-y-2"
                  style={{
                    backgroundColor: `${predictedMeta?.color}10`,
                    borderColor: `${predictedMeta?.color}40`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl" role="img" aria-label={predictedMeta?.simpleName}>
                        {predictedMeta?.emoji}
                      </span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Main Feeling
                        </span>
                        <h2
                          className="text-2xl sm:text-3xl font-extrabold capitalize"
                          style={{ color: predictedMeta?.color }}
                        >
                          {predictedMeta?.simpleName}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {confidenceText} ({confidencePercent}%)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                    {predictedMeta?.simpleDescription}
                  </p>
                </div>

                {/* All 7 Emotions Ranking */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    All Detected Feelings
                  </h4>

                  <div className="space-y-2">
                    {CANONICAL_EMOTION_KEYS.map((key) => {
                      const prob = prediction.probabilities?.[key] || 0;
                      const percentage = Math.round(prob * 100);
                      const isTop = key === prediction.predicted_emotion;
                      const emo = EMOTIONS[key];

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>{emo.emoji}</span>
                              <span className={`font-medium ${isTop ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {emo.simpleName}
                              </span>
                            </div>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {percentage}%
                            </span>
                          </div>

                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${Math.max(percentage, 2)}%`,
                                backgroundColor: emo.color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Sound Quick Facts */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                    Quick Sound Facts
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Length</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {prediction.audio_duration_sec ? `${prediction.audio_duration_sec.toFixed(1)}s` : '2.0s'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Pitch</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {prediction.acoustic_features?.estimated_pitch_hz ? `${prediction.acoustic_features.estimated_pitch_hz} Hz` : 'Normal'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Voice Speed</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Normal Pace
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Easy AI Summary Panel */}
      <div className="space-y-3">
        <AISummaryPanel
          summary={aiSummary}
          isLoading={isAiLoading}
          prediction={prediction}
          isGeminiPowered={isGeminiPowered}
        />
      </div>
    </div>
  );
};
