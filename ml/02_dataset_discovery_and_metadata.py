#!/usr/bin/env python3
"""
Phase 3 & Phase 4: Dataset Discovery & Metadata Generation
---------------------------------------------------------
Author: Senior ML & Speech Processing Engineer
Project: Speech Emotion Recognition (SER) with TESS & Wav2Vec2

This script:
  1. Inspects the TESS directory structure.
  2. Discovers all audio files, formats, and speaker folders.
  3. Maps emotions to the 7 canonical labels:
     ['anger', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']
  4. Generates data/metadata.csv with columns:
     ['file_path', 'emotion', 'speaker', 'word', 'duration', 'sample_rate']
  5. Displays class distribution and checks balance.
"""

import os
import sys
import re
from pathlib import Path
import pandas as pd
import soundfile as sf

# Canonical 7 emotions
CANONICAL_LABELS = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "neutral",
    "sadness",
    "surprise"
]

# Normalization mapping for emotion folder/file names
EMOTION_MAP = {
    "angry": "anger",
    "anger": "anger",
    "disgust": "disgust",
    "fear": "fear",
    "happy": "happiness",
    "happiness": "happiness",
    "neutral": "neutral",
    "sad": "sadness",
    "sadness": "sadness",
    "pleasant_surprise": "surprise",
    "pleasant_surprised": "surprise",
    "ps": "surprise",
    "surprise": "surprise",
}


def discover_dataset(dataset_dir: Path):
    """Phase 3: Inspect dataset structure dynamically without assumptions."""
    print("=" * 60)
    print("PHASE 3: TESS Dataset Discovery & Structure Inspection")
    print("=" * 60)

    if not dataset_dir.exists():
        print(f"[!] Error: Dataset directory {dataset_dir} does not exist.")
        sys.exit(1)

    all_files = [p for p in dataset_dir.glob("**/*") if p.is_file()]
    audio_files = [p for p in all_files if p.suffix.lower() == ".wav"]

    file_extensions = sorted(list(set(p.suffix.lower() for p in all_files)))

    # Discover subdirectories (classes/speaker folders)
    subdirs = sorted([p for p in dataset_dir.glob("**/*") if p.is_dir() and any(p.glob("*.wav"))])

    print(f"Dataset path         : {dataset_dir.resolve()}")
    print(f"Total files found    : {len(all_files)}")
    print(f"Audio files (.wav)   : {len(audio_files)}")
    print(f"Audio formats        : {file_extensions}")
    print(f"Subdirectories found : {len(subdirs)}")
    print("\nSample directories:")
    for d in subdirs[:6]:
        wav_count = len(list(d.glob("*.wav")))
        print(f"  - {d.name} ({wav_count} audio files)")

    return audio_files


def extract_metadata_from_file(file_path: Path):
    """
    Extract speaker, word, and emotion from TESS filename pattern:
    e.g., OAF_back_angry.wav, YAF_youth_pleasant_surprised.wav
    """
    name_stem = file_path.stem  # e.g., OAF_back_angry
    parts = name_stem.split("_")
    
    # Speaker (OAF: Older Actress, YAF: Young Actress)
    speaker = parts[0].upper()
    if speaker == "OA":
        speaker = "OAF"
    
    # Emotion extraction
    # The emotion tag is usually at the end (or last 2 parts like pleasant_surprised)
    raw_emotion = "_".join(parts[2:]).lower()
    if not raw_emotion and len(parts) >= 2:
        raw_emotion = parts[1].lower()

    # Map to canonical label
    canonical = EMOTION_MAP.get(raw_emotion)
    if not canonical:
        # Check if any key is contained in raw_emotion
        for k, v in EMOTION_MAP.items():
            if k in raw_emotion:
                canonical = v
                break

    word = parts[1] if len(parts) > 1 else "unknown"

    return speaker, word, canonical


def generate_metadata(audio_files, output_csv: Path):
    """Phase 4: Create metadata.csv with verified labels and distributions."""
    print("\n" + "=" * 60)
    print("PHASE 4: Create metadata.csv with Verified Labels")
    print("=" * 60)

    records = []
    skipped = 0

    print("Extracting metadata and audio properties...")
    for idx, p in enumerate(audio_files):
        speaker, word, emotion = extract_metadata_from_file(p)
        if not emotion:
            print(f"Warning: Could not determine emotion for {p.name}")
            skipped += 1
            continue

        try:
            info = sf.info(str(p))
            duration = round(info.duration, 4)
            sample_rate = info.samplerate
            channels = info.channels
        except Exception:
            duration = None
            sample_rate = None
            channels = 1

        records.append({
            "file_path": str(p),
            "filename": p.name,
            "speaker": speaker,
            "word": word,
            "emotion": emotion,
            "duration": duration,
            "sample_rate": sample_rate,
            "channels": channels
        })

    df = pd.DataFrame(records)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"[✓] Successfully generated metadata at: {output_csv.resolve()}")
    print(f"Total validated samples: {len(df)} (Skipped: {skipped})")

    # Display emotion distribution
    print("\nEmotion Class Distribution:")
    emo_counts = df["emotion"].value_counts()
    for emo in CANONICAL_LABELS:
        count = emo_counts.get(emo, 0)
        percentage = (count / len(df)) * 100 if len(df) else 0
        print(f"  {emo:<12} : {count:>5} samples ({percentage:.1f}%)")

    # Display speaker distribution
    print("\nSpeaker Distribution:")
    spk_counts = df["speaker"].value_counts()
    for spk, count in spk_counts.items():
        print(f"  {spk:<12} : {count:>5} samples")

    # Audio properties summary
    if "duration" in df and df["duration"].notnull().all():
        print(f"\nAudio Properties:")
        print(f"  Avg Duration  : {df['duration'].mean():.2f}s (Min: {df['duration'].min():.2f}s, Max: {df['duration'].max():.2f}s)")
        print(f"  Sample Rates  : {df['sample_rate'].unique().tolist()} Hz")
        print(f"  Channels      : {df['channels'].unique().tolist()}")

    return df


def main():
    data_root = Path("data/tess")
    out_meta = Path("data/metadata.csv")

    audio_files = discover_dataset(data_root)
    if not audio_files:
        print("[!] No audio files found to create metadata.")
        sys.exit(1)

    generate_metadata(audio_files, out_meta)
    print("\n[SUCCESS] Phase 3 and Phase 4 completed successfully!")


if __name__ == "__main__":
    main()
