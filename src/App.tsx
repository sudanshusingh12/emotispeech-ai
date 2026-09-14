import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { InferenceLab } from './components/InferenceLab';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ModelArchitectureHub } from './components/ModelArchitectureHub';
import { SampleAudio, SystemStatus, AnalysisHistoryItem } from './types';
import { Activity, Radio, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inference' | 'dataset' | 'model'>('dashboard');
  const [inferenceMode, setInferenceMode] = useState<'mic' | 'upload' | 'sample'>('mic');
  const [samples, setSamples] = useState<SampleAudio[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('voxaura_ser_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'hist_init_1',
        timestamp: Date.now() - 1000 * 60 * 12,
        source: 'sample',
        title: 'Happy voice sample',
        predictedEmotion: 'happiness',
        confidence: 0.92,
        duration: 1.9,
        audioUrl: '/data/tess/TESS Toronto emotional speech set data/OAF_happy/OAF_mill_happy.wav'
      },
      {
        id: 'hist_init_2',
        timestamp: Date.now() - 1000 * 60 * 35,
        source: 'sample',
        title: 'Nervous voice sample',
        predictedEmotion: 'fear',
        confidence: 0.88,
        duration: 2.1,
        audioUrl: '/data/tess/TESS Toronto emotional speech set data/YAF_fear/YAF_bite_fear.wav'
      }
    ];
  });

  // Fetch samples and system status
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sampleRes, statusRes] = await Promise.all([
          fetch('/api/sample-audio-list'),
          fetch('/api/status')
        ]);

        if (sampleRes.ok) {
          const sampleData = await sampleRes.json();
          if (sampleData.samples && Array.isArray(sampleData.samples)) {
            setSamples(sampleData.samples);
          }
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSystemStatus(statusData);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Save history to localStorage
  const handleAddHistory = (item: AnalysisHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('voxaura_ser_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Navigation shortcut actions
  const handleQuickMic = () => {
    setInferenceMode('mic');
    setActiveTab('inference');
  };

  const handleQuickUpload = () => {
    setInferenceMode('upload');
    setActiveTab('inference');
  };

  const handleQuickSample = () => {
    setInferenceMode('sample');
    setActiveTab('inference');
  };

  const handleSelectHistoryItem = (item: AnalysisHistoryItem) => {
    setInferenceMode(item.source);
    setActiveTab('inference');
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Universal Website Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickMic={handleQuickMic}
        onQuickUpload={handleQuickUpload}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <HomeDashboard
            systemStatus={systemStatus}
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onLaunchMic={handleQuickMic}
            onLaunchUpload={handleQuickUpload}
            onLaunchSample={handleQuickSample}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'inference' && (
          <InferenceLab
            samples={samples}
            initialMode={inferenceMode}
            onNewHistoryItem={handleAddHistory}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetExplorer
            samples={samples}
            onSelectSample={(sample) => {
              setInferenceMode('sample');
              setActiveTab('inference');
            }}
          />
        )}

        {activeTab === 'model' && (
          <ModelArchitectureHub />
        )}
      </main>

      {/* Standard Website Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Voice Emotion Detector
            </span>
            <span>•</span>
            <span>Understand feelings in any voice</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready & Safe</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
