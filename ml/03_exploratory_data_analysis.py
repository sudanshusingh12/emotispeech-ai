#!/usr/bin/env python3
"""
Phase 5: Exploratory Data Analysis (EDA) for TESS Speech Dataset
---------------------------------------------------------------
Author: Senior ML, DL & Speech Processing Engineer
Project: Speech Emotion Recognition (SER) with TESS & Wav2Vec2

This script:
  1. Loads data/metadata.csv.
  2. Analyzes samples per emotion, speaker distribution, and audio duration statistics.
  3. Generates and saves visual figures:
     - results/eda/emotion_distribution.png
     - results/eda/duration_distribution.png
     - results/eda/waveforms_by_emotion.png (real audio examples from all 7 emotions)
     - results/eda/spectrograms_by_emotion.png (real log-mel spectrograms)
  4. Generates an EDA summary report in results/eda/eda_summary.json.
"""

import os
import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive headless backend
import matplotlib.pyplot as plt
import seaborn as sns
import librosa
import librosa.display

OUTPUT_DIR = Path("results/eda")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CANONICAL_LABELS = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "neutral",
    "sadness",
    "surprise"
]

EMOTION_COLORS = {
    "anger": "#ef4444",
    "disgust": "#f59e0b",
    "fear": "#a855f7",
    "happiness": "#10b981",
    "neutral": "#94a3b8",
    "sadness": "#3b82f6",
    "surprise": "#ec4899"
}


def run_eda():
    meta_path = Path("data/metadata.csv")
    if not meta_path.exists():
        print(f"[!] Error: {meta_path} not found. Run Phase 4 first.")
        sys.exit(1)

    df = pd.read_csv(meta_path)
    print("=" * 60)
    print("PHASE 5: Exploratory Data Analysis (EDA)")
    print("=" * 60)
    print(f"Loaded {len(df)} records from {meta_path}")

    # 1. Statistical Summary
    stats = {
        "total_samples": int(len(df)),
        "emotions": df["emotion"].value_counts().to_dict(),
        "speakers": df["speaker"].value_counts().to_dict(),
        "duration_mean_sec": float(round(df["duration"].mean(), 4)),
        "duration_std_sec": float(round(df["duration"].std(), 4)),
        "duration_min_sec": float(round(df["duration"].min(), 4)),
        "duration_max_sec": float(round(df["duration"].max(), 4)),
        "sample_rates": [int(sr) for sr in df["sample_rate"].unique().tolist()],
        "channels": [int(c) for c in df["channels"].unique().tolist()]
    }

    with open(OUTPUT_DIR / "eda_summary.json", "w") as f:
        json.dump(stats, f, indent=2)
    print(f"[✓] Saved statistical summary to {OUTPUT_DIR / 'eda_summary.json'}")

    # Set aesthetic style
    sns.set_theme(style="darkgrid")
    plt.rcParams.update({'figure.facecolor': '#0f172a', 'axes.facecolor': '#1e293b', 
                         'text.color': '#f8fafc', 'axes.labelcolor': '#cbd5e1', 
                         'xtick.color': '#94a3b8', 'ytick.color': '#94a3b8'})

    # 2. Emotion & Speaker Distribution Chart
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Emotion Bar Plot
    palette = [EMOTION_COLORS.get(e, '#38bdf8') for e in CANONICAL_LABELS]
    sns.countplot(data=df, x="emotion", order=CANONICAL_LABELS, palette=palette, ax=ax1)
    ax1.set_title("Samples per Emotion Class (7 Canonical)", fontsize=13, fontweight="bold", pad=12)
    ax1.set_xlabel("Emotion", fontsize=11)
    ax1.set_ylabel("Audio Sample Count", fontsize=11)
    ax1.set_xticklabels(CANONICAL_LABELS, rotation=30, ha="right")
    for p in ax1.patches:
        ax1.annotate(f"{int(p.get_height())}", (p.get_x() + p.get_width() / 2., p.get_height() - 40),
                     ha='center', va='center', fontsize=10, color='white', fontweight='bold')

    # Speaker Distribution
    speaker_colors = ["#38bdf8", "#818cf8"]
    sns.countplot(data=df, x="speaker", palette=speaker_colors, ax=ax2)
    ax2.set_title("Speaker Distribution (OAF vs YAF)", fontsize=13, fontweight="bold", pad=12)
    ax2.set_xlabel("Speaker Persona", fontsize=11)
    ax2.set_ylabel("Count", fontsize=11)
    for p in ax2.patches:
        ax2.annotate(f"{int(p.get_height())} (50%)", (p.get_x() + p.get_width() / 2., p.get_height() - 100),
                     ha='center', va='center', fontsize=11, color='white', fontweight='bold')

    plt.tight_layout()
    chart1_path = OUTPUT_DIR / "emotion_distribution.png"
    plt.savefig(chart1_path, dpi=200)
    plt.close()
    print(f"[✓] Saved {chart1_path}")

    # 3. Audio Duration Distribution by Emotion
    fig, ax = plt.subplots(figsize=(10, 5))
    sns.boxplot(data=df, x="emotion", y="duration", order=CANONICAL_LABELS, palette=palette, ax=ax)
    ax.set_title("Audio Duration Distribution Across Emotions (Seconds)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Emotion", fontsize=11)
    ax.set_ylabel("Duration (s)", fontsize=11)
    ax.axhline(df["duration"].mean(), color="#38bdf8", linestyle="--", alpha=0.7, label=f"Mean Duration ({df['duration'].mean():.2f}s)")
    ax.legend(loc="upper right")
    plt.tight_layout()
    chart2_path = OUTPUT_DIR / "duration_distribution.png"
    plt.savefig(chart2_path, dpi=200)
    plt.close()
    print(f"[✓] Saved {chart2_path}")

    # 4. Waveform Examples (Real recordings from each of the 7 emotions)
    print("Generating real waveform examples for each emotion...")
    fig, axes = plt.subplots(7, 1, figsize=(14, 15), sharex=False)
    sample_files = {}

    for i, emo in enumerate(CANONICAL_LABELS):
        sample_row = df[df["emotion"] == emo].iloc[10]  # Pick representative example
        file_p = sample_row["file_path"]
        sample_files[emo] = file_p
        
        y, sr = librosa.load(file_p, sr=16000, mono=True)
        time_axis = np.linspace(0, len(y) / sr, len(y))
        
        ax = axes[i]
        ax.plot(time_axis, y, color=EMOTION_COLORS[emo], linewidth=0.9, alpha=0.9)
        ax.set_title(f"Emotion: {emo.upper()} | Word: '{sample_row['word']}' | Speaker: {sample_row['speaker']} | Duration: {len(y)/sr:.2f}s",
                     loc="left", fontsize=10, fontweight="bold")
        ax.set_ylabel("Amplitude", fontsize=9)
        ax.set_ylim(-1.05, 1.05)
        if i == 6:
            ax.set_xlabel("Time (seconds)", fontsize=10)

    plt.tight_layout()
    chart3_path = OUTPUT_DIR / "waveforms_by_emotion.png"
    plt.savefig(chart3_path, dpi=200)
    plt.close()
    print(f"[✓] Saved {chart3_path}")

    # 5. Spectrogram Examples (Log-Mel Spectrograms of Real Audio)
    print("Generating real log-mel spectrograms for each emotion...")
    fig, axes = plt.subplots(4, 2, figsize=(16, 14))
    axes_flat = axes.flatten()

    for i, emo in enumerate(CANONICAL_LABELS):
        file_p = sample_files[emo]
        y, sr = librosa.load(file_p, sr=16000, mono=True)
        
        # Log-Mel Spectrogram
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=80, fmax=8000)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        ax = axes_flat[i]
        img = librosa.display.specshow(mel_spec_db, x_axis='time', y_axis='mel', sr=sr, fmax=8000, ax=ax, cmap='magma')
        ax.set_title(f"Log-Mel Spectrogram — {emo.upper()} ({sample_row['speaker']})", fontsize=11, fontweight="bold")
        fig.colorbar(img, ax=ax, format='%+2.0f dB')

    # Remove extra subplot
    fig.delaxes(axes_flat[7])

    plt.tight_layout()
    chart4_path = OUTPUT_DIR / "spectrograms_by_emotion.png"
    plt.savefig(chart4_path, dpi=200)
    plt.close()
    print(f"[✓] Saved {chart4_path}")

    print("\n[SUCCESS] Phase 5 completed successfully!")


if __name__ == "__main__":
    run_eda()
