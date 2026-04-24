"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "./Alert";
import Button from "./Button";
import Card from "./Card";

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function MicroIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11.5a7 7 0 0 1-14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5V22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.5 22h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m8.5 9.5 3.5-3.5 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

function getExtensionFromMimeType(mimeType) {
  if (!mimeType) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export default function VoiceMessageBox({
  onSend,
  disabled = false,
  transcription = "",
}) {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [status, setStatus] = useState("ready");
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleOpenFilePicker() {
    if (disabled || status === "recording") return;
    fileInputRef.current?.click();
  }
 function normalizeMimeType(value) {
  return (value || "").split(";")[0].trim().toLowerCase();
}

function validateAudioFile(file) {
  const allowedTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "video/webm",
  ];

  const normalizedType = normalizeMimeType(file.type);

  if (!allowedTypes.includes(normalizedType)) {
    throw new Error(
      `Format audio non supporté: ${file.type || "inconnu"}. Utilise mp3, wav, webm, ogg ou m4a.`
    );
  }
}
  function setFileWithMetadata(file) {
    validateAudioFile(file);

    setSelectedFile(file);

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0);
      URL.revokeObjectURL(audio.src);
    };

    audio.onerror = () => {
      setAudioDuration(0);
      URL.revokeObjectURL(audio.src);
    };

    setStatus("file_selected");
  }

  async function startRecording() {
    if (disabled) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Enregistrement micro non supporté sur ce navigateur.");
      setStatus("error");
      return;
    }

    try {
      setError("");
      setSelectedFile(null);
      setAudioDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        try {
          const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: finalMimeType });

          if (!blob.size) {
            throw new Error("Aucun audio enregistré.");
          }

          const extension = getExtensionFromMimeType(finalMimeType);
          const file = new File([blob], `recording-${Date.now()}.${extension}`, {
            type: finalMimeType,
          });

          setFileWithMetadata(file);
        } catch (err) {
          setStatus("error");
          setError(err?.message || "Impossible de récupérer l'enregistrement.");
        } finally {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
        }
      };

      recorder.start();
      setStatus("recording");
      setAudioDuration(0);

      timerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setStatus("error");
      setError(
        err?.message || "Impossible d'accéder au microphone. Vérifie l'autorisation."
      );
    }
  }

  function stopRecording() {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else {
        setStatus("ready");
      }
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Impossible d'arrêter l'enregistrement.");
    }
  }

  function handleRecordClick() {
    if (disabled || status === "sending") return;

    if (status === "recording") {
      stopRecording();
      return;
    }

    startRecording();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setFileWithMetadata(file);
    } catch (err) {
      setSelectedFile(null);
      setAudioDuration(0);
      setStatus("error");
      setError(err?.message || "Fichier audio invalide.");
    }
  }

  async function handleSend() {
    if (disabled || !selectedFile) {
      setError("Sélectionne d’abord un fichier audio.");
      return;
    }

    try {
      setError("");
      setStatus("sending");

      if (onSend) {
        await onSend(selectedFile);
      }

      setStatus("ready");
      setSelectedFile(null);
      setAudioDuration(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Impossible d’envoyer le fichier audio.");
    }
  }

  function handleRemoveFile() {
    if (status === "recording") {
      stopRecording();
    }

    setSelectedFile(null);
    setAudioDuration(0);
    setError("");
    setStatus("ready");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function getStatusLabel() {
    if (status === "recording") return "Enregistrement";
    if (status === "sending") return "Envoi";
    if (status === "error") return "Erreur";
    if (status === "file_selected") return "Fichier prêt";
    return "Prêt";
  }

  return (
    <Card
      style={{
        padding: "22px",
        borderRadius: "24px",
      }}
    >
      {error && (
        <Alert type="error" style={{ marginBottom: "16px", borderRadius: "16px" }}>
          {error}
        </Alert>
      )}

      <div className="layout">
        <div className="left-col">
          <div className="transcription-card">
            <p className="section-label">Transcription reçue</p>
            <p className="transcription-text">
              {transcription || "Aucune transcription reçue pour le moment."}
            </p>
          </div>

          {selectedFile && (
            <div className="file-card">
              <p className="section-label">Fichier sélectionné</p>
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-meta">
                Durée : {formatDuration(audioDuration)} • Taille :{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        <div className="right-col">
          <span
            className={`status-badge ${
              status === "recording"
                ? "recording"
                : status === "sending"
                ? "sending"
                : status === "error"
                ? "error"
                : "ready"
            }`}
          >
            {getStatusLabel()}
          </span>

          <button
            type="button"
            className={`round-button micro-button ${
              status === "recording" ? "recording" : ""
            }`}
            onClick={handleRecordClick}
            disabled={disabled || status === "sending"}
            aria-label="Micro"
          >
            <MicroIcon />
          </button>

          <button
            type="button"
            className="round-button upload-button"
            onClick={handleOpenFilePicker}
            disabled={disabled || status === "sending" || status === "recording"}
            aria-label="Importer un audio"
          >
            <UploadIcon />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {selectedFile && (
            <div className="file-actions">
              <Button
                type="button"
                onClick={handleSend}
                disabled={disabled || status === "sending"}
              >
                {status === "sending" ? "Envoi..." : "Envoyer l’audio"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleRemoveFile}
                disabled={status === "sending"}
              >
                Retirer
              </Button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 140px;
          gap: 24px;
          align-items: stretch;
        }

        .left-col {
          display: flex;
          flex-direction: column;
          justify-content: stretch;
          min-width: 0;
        }

        .right-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 18px;
          min-height: 100%;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .status-badge.ready {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .status-badge.recording {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fdba74;
        }

        .status-badge.sending {
          background: #f8fafc;
          color: #334155;
          border-color: #cbd5e1;
        }

        .status-badge.error {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .transcription-card,
        .file-card {
          background: linear-gradient(135deg, #f8fbff, #ffffff);
          border: 1px solid #dbe3ef;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .file-card {
          margin-top: 14px;
        }

        .section-label {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
        }

        .transcription-text {
          margin: 10px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.75;
          white-space: pre-line;
        }

        .file-name {
          margin: 10px 0 0;
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
          word-break: break-word;
        }

        .file-meta {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        .round-button {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .round-button:hover {
          transform: translateY(-1px);
        }

        .round-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .micro-button {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
        }

        .micro-button.recording {
          background: linear-gradient(135deg, #ea580c, #f97316);
        }

        .upload-button {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
        }

        .file-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .right-col {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-start;
            align-items: center;
          }
        }

        @media (max-width: 640px) {
          .right-col {
            flex-direction: column;
            align-items: flex-start;
          }

          .round-button {
            width: 54px;
            height: 54px;
          }
        }
      `}</style>
    </Card>
  );
}