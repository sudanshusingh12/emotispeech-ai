#!/usr/bin/env python3
"""
Phase 8: Wav2Vec2 Fine-Tuning Pipeline for Speech Emotion Recognition (SER)
--------------------------------------------------------------------------
Dataset: TESS (2,800 speech samples, 7 canonical emotions)
Backbone: facebook/wav2vec2-base
Architecture:
  - Feature Extractor: Frozen CNN layers
  - Transformer Encoder: Fine-tuned representations
  - Classification Head: Mean pooling + Dropout(0.25) + Linear projection (7 classes)
"""

import os
import sys
import json
import time
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import librosa
from sklearn.metrics import accuracy_score, f1_score, classification_report
from transformers import AutoFeatureExtractor, Wav2Vec2Model, Wav2Vec2Config

CANONICAL_LABELS = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "neutral",
    "sadness",
    "surprise"
]
LABEL_TO_ID = {label: i for i, label in enumerate(CANONICAL_LABELS)}
ID_TO_LABEL = {i: label for i, label in enumerate(CANONICAL_LABELS)}

MODEL_CHECKPOINT = "facebook/wav2vec2-base"
SAMPLE_RATE = 16000
MAX_DURATION_SEC = 2.5
MAX_SAMPLES = int(SAMPLE_RATE * MAX_DURATION_SEC)  # 40,000 samples

OUTPUT_DIR = Path("models/wav2vec2-ser-tess")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TRAINING_LOG_PATH = OUTPUT_DIR / "training_progress.json"


def write_progress(epoch: int, total_epochs: int, step: int, total_steps: int, 
                   train_loss: float, val_loss: float, val_acc: float, val_f1: float,
                   status: str = "training", eta_sec: float = 0.0, history: list = None):
    data = {
        "status": status,
        "current_epoch": epoch,
        "total_epochs": total_epochs,
        "current_step": step,
        "total_steps": total_steps,
        "train_loss": round(train_loss, 4),
        "val_loss": round(val_loss, 4),
        "val_accuracy": round(val_acc, 4),
        "val_f1": round(val_f1, 4),
        "eta_seconds": int(eta_sec),
        "history": history or [],
        "updated_at": time.time()
    }
    with open(TRAINING_LOG_PATH, "w") as f:
        json.dump(data, f, indent=2)


class TESSAudioDataset(Dataset):
    def __init__(self, csv_path: str, max_samples: int = MAX_SAMPLES):
        self.df = pd.read_csv(csv_path)
        self.max_samples = max_samples

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        file_path = row["file_path"]
        emotion = row["emotion"]
        label_id = LABEL_TO_ID[emotion]

        try:
            audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
        except Exception:
            audio = np.zeros(self.max_samples, dtype=np.float32)

        if len(audio) > self.max_samples:
            audio = audio[:self.max_samples]
        else:
            padding = self.max_samples - len(audio)
            audio = np.pad(audio, (0, padding), 'constant')

        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak

        return torch.tensor(audio, dtype=torch.float32), torch.tensor(label_id, dtype=torch.long)


class Wav2Vec2ForSpeechEmotionClassification(nn.Module):
    def __init__(self, num_labels: int = 7):
        super().__init__()
        self.num_labels = num_labels
        self.config = Wav2Vec2Config.from_pretrained(MODEL_CHECKPOINT)
        self.wav2vec2 = Wav2Vec2Model.from_pretrained(MODEL_CHECKPOINT)
        
        # Freeze CNN feature extractor
        self.wav2vec2.feature_extractor._freeze_parameters()
        
        # Freeze first 6 layers for efficiency on CPU
        for layer in self.wav2vec2.encoder.layers[:6]:
            for param in layer.parameters():
                param.requires_grad = False

        hidden_size = self.config.hidden_size
        self.projector = nn.Sequential(
            nn.Dropout(0.25),
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_labels)
        )

    def forward(self, input_values, labels=None):
        outputs = self.wav2vec2(input_values)
        hidden_states = outputs.last_hidden_state
        pooled = torch.mean(hidden_states, dim=1)
        logits = self.projector(pooled)

        loss = None
        if labels is not None:
            loss = F.cross_entropy(logits, labels)

        return {"loss": loss, "logits": logits}


def evaluate(model, dataloader, device):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for audio, labels in dataloader:
            audio, labels = audio.to(device), labels.to(device)
            outputs = model(audio, labels=labels)
            total_loss += outputs["loss"].item()
            preds = torch.argmax(outputs["logits"], dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.cpu().numpy())

    val_loss = total_loss / max(len(dataloader), 1)
    acc = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average="weighted")
    return val_loss, acc, f1, all_labels, all_preds


def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Phase 8] Starting training on device: {device}")
    
    train_dataset = TESSAudioDataset("data/train.csv")
    val_dataset = TESSAudioDataset("data/val.csv")
    test_dataset = TESSAudioDataset("data/test.csv")

    batch_size = 8
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    total_epochs = 3
    total_steps = len(train_loader) * total_epochs

    write_progress(0, total_epochs, 0, total_steps, 0.0, 0.0, 0.0, 0.0, 
                   status="downloading_backbone", eta_sec=0)
    print("Loading pretrained facebook/wav2vec2-base model...")
    model = Wav2Vec2ForSpeechEmotionClassification(num_labels=len(CANONICAL_LABELS))
    model.to(device)

    feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_CHECKPOINT)
    feature_extractor.save_pretrained(OUTPUT_DIR)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()), 
        lr=1e-4, 
        weight_decay=0.01
    )

    history = []
    global_step = 0
    start_time = time.time()
    best_val_acc = 0.0

    print("\n--- Beginning Fine-Tuning Loop ---")
    for epoch in range(1, total_epochs + 1):
        model.train()
        epoch_loss = 0.0
        
        for step, (audio, labels) in enumerate(train_loader):
            global_step += 1
            audio, labels = audio.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(audio, labels=labels)
            loss = outputs["loss"]
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            epoch_loss += loss.item()

            if (step + 1) % 15 == 0 or (step + 1) == len(train_loader):
                elapsed = time.time() - start_time
                steps_done = global_step
                steps_left = total_steps - steps_done
                rate = elapsed / max(steps_done, 1)
                eta = steps_left * rate

                current_train_loss = epoch_loss / (step + 1)
                print(f"Epoch [{epoch}/{total_epochs}] Step [{step+1}/{len(train_loader)}] "
                      f"Loss: {current_train_loss:.4f} | ETA: {int(eta)}s")
                
                write_progress(
                    epoch, total_epochs, global_step, total_steps,
                    current_train_loss, 0.0, 0.0, 0.0,
                    status="training", eta_sec=eta, history=history
                )

        val_loss, val_acc, val_f1, _, _ = evaluate(model, val_loader, device)
        avg_train_loss = epoch_loss / len(train_loader)
        
        print(f"Epoch {epoch} Complete -> Train Loss: {avg_train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | Val F1: {val_f1*100:.2f}%")
        
        history.append({
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc * 100, 2),
            "val_f1": round(val_f1 * 100, 2)
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), OUTPUT_DIR / "best_model.pt")
            with open(OUTPUT_DIR / "config.json", "w") as f:
                json.dump({
                    "model_type": "wav2vec2_ser",
                    "num_labels": len(CANONICAL_LABELS),
                    "labels": CANONICAL_LABELS,
                    "id_to_label": ID_TO_LABEL,
                    "label_to_id": LABEL_TO_ID,
                    "sample_rate": SAMPLE_RATE,
                    "best_val_acc": round(val_acc * 100, 2),
                    "best_val_f1": round(val_f1 * 100, 2),
                }, f, indent=2)

        write_progress(
            epoch, total_epochs, global_step, total_steps,
            avg_train_loss, val_loss, val_acc, val_f1,
            status="training", eta_sec=0, history=history
        )

    # Final Evaluation on Hold-Out Test Set (420 samples)
    model.load_state_dict(torch.load(OUTPUT_DIR / "best_model.pt", map_location=device))
    test_loss, test_acc, test_f1, true_labels, pred_labels = evaluate(model, test_loader, device)
    
    report = classification_report(true_labels, pred_labels, target_names=CANONICAL_LABELS, output_dict=True)
    results_dir = Path("results/evaluation")
    results_dir.mkdir(parents=True, exist_ok=True)
    with open(results_dir / "test_evaluation.json", "w") as f:
        json.dump({
            "test_accuracy": round(test_acc * 100, 2),
            "test_f1": round(test_f1 * 100, 2),
            "test_loss": round(test_loss, 4),
            "classification_report": report,
            "num_test_samples": len(test_dataset)
        }, f, indent=2)

    write_progress(
        total_epochs, total_epochs, total_steps, total_steps,
        avg_train_loss, test_loss, test_acc, test_f1,
        status="completed", eta_sec=0, history=history
    )
    print("\n[✓] Training & Evaluation Pipeline Completed Successfully!")


if __name__ == "__main__":
    train()
