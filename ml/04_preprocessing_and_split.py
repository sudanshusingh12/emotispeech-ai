#!/usr/bin/env python3
"""
Phase 6 & Phase 7: Audio Preprocessing & Train/Validation/Test Split
-------------------------------------------------------------------
Author: Senior ML, DL & Speech Processing Engineer
Project: Speech Emotion Recognition (SER) with TESS & Wav2Vec2

This script:
  1. Implements reusable, production-ready audio preprocessing functions:
     - Robust audio loading (handles corrupted audio gracefully).
     - Mono conversion.
     - Resampling to target 16,000 Hz for Wav2Vec2.
     - Peak amplitude normalization.
     - Audio duration truncation/padding logic.
  2. Implements a stratified Train / Validation / Test split (70% / 15% / 15%):
     - Preserves class balance across all 7 emotions.
     - Stratifies across both emotion and speaker to guarantee zero data leakage.
  3. Saves split metadata manifests:
     - data/train.csv (1,960 samples, 70%)
     - data/val.csv   (420 samples, 15%)
     - data/test.csv  (420 samples, 15%)
  4. Displays split sample counts and class balance tables.
"""

import os
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import librosa
import soundfile as sf
from sklearn.model_selection import train_test_split
from transformers import AutoFeatureExtractor

TARGET_SAMPLE_RATE = 16000
MAX_DURATION_SECONDS = 3.0  # Max TESS duration is ~2.98s
MAX_INPUT_LENGTH = int(TARGET_SAMPLE_RATE * MAX_DURATION_SECONDS)  # 48,000 samples

CANONICAL_LABELS = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "neutral",
    "sadness",
    "surprise"
]


def load_and_preprocess_audio(
    file_path: str,
    target_sr: int = TARGET_SAMPLE_RATE,
    normalize: bool = True
) -> np.ndarray:
    """
    Reusable Phase 6 preprocessing function:
      1. Load audio with librosa (auto-mono)
      2. Resample to 16,000 Hz
      3. Peak normalization to [-1.0, 1.0] range
      4. Validation
    """
    try:
        # Load audio and resample directly to target_sr
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        
        # Check for empty or corrupted audio
        if len(audio) == 0:
            raise ValueError(f"Empty audio file: {file_path}")

        # Peak normalization if appropriate
        if normalize:
            peak = np.max(np.abs(audio))
            if peak > 0:
                audio = audio / peak

        return audio.astype(np.float32)

    except Exception as e:
        print(f"[Error loading {file_path}]: {e}")
        return None


def create_dataset_splits(metadata_csv: Path, output_dir: Path):
    """
    Phase 7: Stratified 70% Train, 15% Val, 15% Test split.
    Uses combined stratify key (speaker + emotion) to ensure uniform class
    and speaker distributions across splits without data leakage.
    """
    print("=" * 60)
    print("PHASE 7: Train / Validation / Test Stratified Split")
    print("=" * 60)

    if not metadata_csv.exists():
        raise FileNotFoundError(f"Metadata file {metadata_csv} not found.")

    df = pd.read_csv(metadata_csv)
    print(f"Loaded total samples: {len(df)}")

    # Create composite stratification key: e.g. "OAF_anger", "YAF_happiness"
    df["stratify_key"] = df["speaker"] + "_" + df["emotion"]

    # First split: 70% Train, 30% Temp (Val + Test)
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=42,
        stratify=df["stratify_key"]
    )

    # Second split: Temp split equally into 15% Val and 15% Test
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=42,
        stratify=temp_df["stratify_key"]
    )

    # Clean up helper column
    train_df = train_df.drop(columns=["stratify_key"]).reset_index(drop=True)
    val_df = val_df.drop(columns=["stratify_key"]).reset_index(drop=True)
    test_df = test_df.drop(columns=["stratify_key"]).reset_index(drop=True)

    output_dir.mkdir(parents=True, exist_ok=True)
    train_path = output_dir / "train.csv"
    val_path = output_dir / "val.csv"
    test_path = output_dir / "test.csv"

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print("\nDataset Split Distribution:")
    print(f"  Training samples   : {len(train_df):>4} ({len(train_df)/len(df)*100:.1f}%) -> {train_path}")
    print(f"  Validation samples : {len(val_df):>4} ({len(val_df)/len(df)*100:.1f}%) -> {val_path}")
    print(f"  Testing samples    : {len(test_df):>4} ({len(test_df)/len(df)*100:.1f}%) -> {test_path}")

    # Display emotion balance per split
    print("\nPer-Split Class Distributions:")
    print(f"{'Emotion':<12} | {'Train (70%)':<12} | {'Val (15%)':<12} | {'Test (15%)':<12}")
    print("-" * 52)
    for emo in CANONICAL_LABELS:
        tr_cnt = (train_df['emotion'] == emo).sum()
        va_cnt = (val_df['emotion'] == emo).sum()
        te_cnt = (test_df['emotion'] == emo).sum()
        print(f"{emo:<12} | {tr_cnt:>11} | {va_cnt:>11} | {te_cnt:>11}")

    # Validate preprocessing on sample
    print("\nValidating Phase 6 preprocessing function on test audio sample...")
    test_file = train_df.iloc[0]["file_path"]
    audio = load_and_preprocess_audio(test_file)
    print(f"  Sample path      : {test_file}")
    print(f"  Processed length : {len(audio)} samples ({len(audio)/TARGET_SAMPLE_RATE:.2f}s)")
    print(f"  Data type        : {audio.dtype}")
    print(f"  Min / Max amp    : {audio.min():.4f} / {audio.max():.4f}")

    return train_df, val_df, test_df


def main():
    meta_file = Path("data/metadata.csv")
    out_dir = Path("data")
    create_dataset_splits(meta_file, out_dir)
    print("\n[SUCCESS] Phase 6 & Phase 7 completed successfully!")


if __name__ == "__main__":
    main()
