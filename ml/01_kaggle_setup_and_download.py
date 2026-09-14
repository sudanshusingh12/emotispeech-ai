#!/usr/bin/env python3
"""
Phase 1 & Phase 2: Environment Setup, Kaggle API Authentication & TESS Dataset Acquisition
-----------------------------------------------------------------------------------------
Author: Senior ML & Speech Processing Engineer
Project: Speech Emotion Recognition (SER) with TESS & Wav2Vec2

This script:
  1. Checks and reports the system environment (Python, PyTorch, CUDA / GPU).
  2. Verifies and configures secure Kaggle API credentials via environment variables
     or ~/.kaggle/kaggle.json without hardcoding secrets.
  3. Programmatically downloads and extracts the TESS dataset via Kaggle Dataset API.
  4. Verifies extracted audio files (.wav) and confirms directory structure.
"""

import os
import sys
import argparse
import zipfile
from pathlib import Path

# Load .env if present (dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def check_environment():
    """Phase 1: Verify Python, PyTorch, and Compute Device (CUDA/CPU)."""
    print("\n" + "=" * 60)
    print("PHASE 1: System & Deep Learning Environment Verification")
    print("=" * 60)
    print(f"Python Version: {sys.version.split()[0]}")
    
    try:
        import torch
        print(f"PyTorch Version: {torch.__version__}")
        cuda_available = torch.cuda.is_available()
        print(f"CUDA Available: {cuda_available}")
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
            device_count = torch.cuda.device_count()
            print(f"GPU Device(s): {device_count} x {device_name}")
        else:
            print("Device: CPU (Transfer learning and inference will run on CPU)")
    except ImportError:
        print("WARNING: PyTorch is not yet installed in this environment.")
        return False

    # Check key audio & ML packages
    optional_packages = ["torchaudio", "transformers", "datasets", "librosa", "soundfile", "sklearn", "kaggle"]
    for pkg in optional_packages:
        try:
            import importlib.util
            spec = importlib.util.find_spec(pkg)
            if spec is not None:
                print(f"  [✓] {pkg:<14} : installed")
            else:
                print(f"  [✗] {pkg:<14} : Not installed yet")
        except Exception:
            print(f"  [✗] {pkg:<14} : Not installed yet")

    return True


def check_kaggle_auth():
    """
    Phase 2: Securely verify Kaggle API credentials.
    Supports:
      1. Environment variables: KAGGLE_USERNAME and KAGGLE_KEY
      2. Configuration file: ~/.kaggle/kaggle.json or ~/.config/kaggle/kaggle.json (strict 600)
    Never hardcodes any credentials.
    """
    print("\n" + "=" * 60)
    print("PHASE 2: Kaggle Dataset API Authentication Check")
    print("=" * 60)

    username = os.environ.get("KAGGLE_USERNAME") or os.environ.get("KAGGLE_USER")
    key = os.environ.get("KAGGLE_KEY")
    kaggle_json_path1 = Path.home() / ".kaggle" / "kaggle.json"
    kaggle_json_path2 = Path.home() / ".config" / "kaggle" / "kaggle.json"

    if username and key:
        masked_user = f"{username[:3]}{'*' * (len(username) - 3) if len(username) > 3 else '***'}"
        print(f"[✓] Found Kaggle API credentials in environment variables:")
        print(f"    KAGGLE_USERNAME: {masked_user}")
        print(f"    KAGGLE_KEY     : {'*' * 8} (hidden)")
        return True
    elif kaggle_json_path1.is_file() or kaggle_json_path2.is_file():
        cfg_path = kaggle_json_path1 if kaggle_json_path1.is_file() else kaggle_json_path2
        print(f"[✓] Found Kaggle configuration file at: {cfg_path}")
        return True
    else:
        print("[!] Kaggle credentials not detected.")
        print("\nTo configure Kaggle API authentication securely (choose one option):\n")
        print("Option A (Environment Variables - Recommended):")
        print('  export KAGGLE_USERNAME="<your_kaggle_username>"')
        print('  export KAGGLE_KEY="<your_kaggle_api_token>"')
        print("\nOption B (Kaggle Credentials JSON File):")
        print('  1. Go to https://www.kaggle.com/settings -> "Create New Token"')
        print('  2. Place the downloaded kaggle.json at ~/.kaggle/kaggle.json:')
        print('     mkdir -p ~/.kaggle')
        print('     cp /path/to/kaggle.json ~/.kaggle/kaggle.json')
        print('     chmod 600 ~/.kaggle/kaggle.json')
        return False


def download_tess_dataset(dataset_id: str, target_dir: Path):
    """
    Programmatically download and extract TESS dataset using Kaggle API.
    """
    print("\n" + "=" * 60)
    print(f"Downloading TESS Dataset: '{dataset_id}'")
    print(f"Destination Directory : {target_dir.resolve()}")
    print("=" * 60)

    target_dir.mkdir(parents=True, exist_ok=True)

    # Check if files already exist to avoid re-downloading
    existing_wavs = list(target_dir.glob("**/*.wav"))
    if len(existing_wavs) >= 2800:
        print(f"[✓] Dataset already present! Found {len(existing_wavs)} .wav files in {target_dir}")
        return target_dir

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        print("[✓] Kaggle API authentication successful.")

        print(f"Downloading dataset '{dataset_id}' to {target_dir} (with auto-extraction)...")
        api.dataset_download_files(dataset_id, path=str(target_dir), unzip=True, quiet=False)
        print("[✓] Download and extraction complete.")

    except Exception as e:
        print(f"[!] Error downloading via Kaggle API: {e}")
        # Check if a zip file was downloaded but not unzipped
        zip_files = list(target_dir.glob("*.zip"))
        if zip_files:
            print(f"Found zip file {zip_files[0]}, extracting manually...")
            with zipfile.ZipFile(zip_files[0], 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            print("[✓] Manual extraction completed.")
        else:
            raise e

    # Discover downloaded .wav audio files
    wav_files = list(target_dir.glob("**/*.wav"))
    print(f"\n[✓] Verification: Total .wav audio files extracted: {len(wav_files)}")
    if len(wav_files) == 0:
        print("[!] Warning: No .wav files were found in target directory.")
    else:
        print(f"Sample audio path: {wav_files[0]}")

    return target_dir


def main():
    parser = argparse.ArgumentParser(description="Phase 1 & 2: Environment & Kaggle TESS Acquisition")
    parser.add_argument(
        "--dataset",
        type=str,
        default="ejlok1/toronto-emotional-speech-set-tess",
        help="Kaggle dataset identifier (default: ejlok1/toronto-emotional-speech-set-tess)"
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/tess",
        help="Destination directory for TESS dataset (default: data/tess)"
    )
    args = parser.parse_args()

    # 1. Environment Check
    check_environment()

    # 2. Kaggle Authentication Check
    auth_ok = check_kaggle_auth()

    # 3. Dataset Download if credentials are valid
    if auth_ok:
        target_path = Path(args.data_dir)
        try:
            download_tess_dataset(args.dataset, target_path)
            print("\n[SUCCESS] Phase 1 and Phase 2 completed successfully!")
            print(f"Ready for Phase 3: Dataset Discovery & Inspection.")
        except Exception as err:
            print(f"\n[ERROR] Dataset download failed: {err}")
            sys.exit(1)
    else:
        print("\n[NEXT STEP] Please provide your Kaggle API credentials to proceed with automated download.")
        print("Command to test once configured:")
        print("  python3 ml/01_kaggle_setup_and_download.py")


if __name__ == "__main__":
    main()
