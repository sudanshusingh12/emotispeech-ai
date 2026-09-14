export interface SampleAudio {
  file_path: string;
  filename: string;
  speaker: string;
  word: string;
  emotion: string;
  duration: string;
  sample_rate: string;
  url: string;
}

export interface AcousticFeatures {
  rms_energy?: number;
  zero_crossing_rate?: number;
  dynamic_range_db?: number;
  estimated_pitch_hz?: number;
  total_samples?: number;
}

export interface CircumplexAffect {
  valence: number; // -1.0 to 1.0
  arousal: number; // 0.0 to 1.0
  description: string;
}

export interface AISpeechSummary {
  summary: string;
  prosody_analysis: string;
  circumplex: CircumplexAffect;
  conversational_context: string;
  recommended_action: string;
  acoustic_insights: string[];
}

export interface PredictionResult {
  predicted_emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  audio_duration_sec?: number;
  sampling_rate?: number;
  acoustic_features?: AcousticFeatures;
  status?: string;
  method?: string;
  audioUrl?: string;
  error?: string;
  details?: string;
}

export interface SystemStatus {
  phase: number;
  system: {
    pythonVersion: string;
    torchVersion: string;
    cudaAvailable: boolean;
    gpuName: string;
    packages: Record<string, string>;
  };
  kaggle: {
    configured: boolean;
    authMethod: string;
    usernameMasked: string | null;
  };
  dataset: {
    exists: boolean;
    path: string;
    audioCount: number;
    expectedCount: number;
    sampleFiles: string[];
  };
  eda?: {
    hasEda: boolean;
    hasSplits: boolean;
  };
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  source: 'mic' | 'upload' | 'sample';
  title: string;
  predictedEmotion: string;
  confidence: number;
  duration: number;
  audioUrl?: string;
}

export interface EmotionMeta {
  label: string;
  displayName: string;
  simpleName: string;
  emoji: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  description: string;
  simpleDescription: string;
  simpleTip: string;
  valence: number;
  arousal: number;
  acousticHallmarks: string;
}
