import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { IconUser } from "../icons";

type SelfieCaptureProps = {
  token: string;
  uploaded: boolean;
  onUploaded: () => void;
  onClear?: () => void;
};

type CaptureMode = "idle" | "camera" | "preview" | "uploading";

function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Camera access was denied. Allow camera permission or upload a photo instead.";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "No camera found on this device. Upload a photo instead.";
    }
    if (err.name === "NotReadableError") {
      return "Camera is in use by another app. Close it or upload a photo instead.";
    }
  }
  return err instanceof Error ? err.message : "Could not access camera";
}

export function SelfieCapture({ token, uploaded, onUploaded, onClear }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<CaptureMode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  useEffect(
    () => () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [stopCamera, previewUrl],
  );

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().then(() => setCameraReady(true)).catch(() => setCameraReady(false));
      });
    } catch (err) {
      setError(cameraErrorMessage(err));
      setMode("idle");
    }
  }, [stopCamera]);

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    stopCamera();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture image. Try again.");
          return;
        }
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setCapturedFile(file);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setMode("preview");
      },
      "image/jpeg",
      0.92,
    );
  }, [stopCamera]);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please choose a JPEG, PNG, or WebP image.");
        return;
      }
      setError(null);
      stopCamera();
      const url = URL.createObjectURL(file);
      setCapturedFile(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setMode("preview");
    },
    [stopCamera],
  );

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedFile(null);
    setError(null);
    setMode("idle");
    onClear?.();
  }, [onClear, previewUrl]);

  const confirmUpload = useCallback(async () => {
    if (!capturedFile) return;
    setMode("uploading");
    setError(null);
    try {
      await api.uploadKycSelfie(token, capturedFile);
      onUploaded();
      setMode("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setMode("preview");
    }
  }, [capturedFile, onUploaded, token]);

  if (uploaded && mode === "idle") {
    return (
      <div className="kyc-selfie-capture kyc-selfie-capture--done">
        <div className="kyc-selfie-preview-frame">
          {previewUrl ? (
            <img src={previewUrl} alt="Your captured selfie" className="kyc-selfie-preview-img" />
          ) : (
            <div className="kyc-selfie-preview-placeholder" aria-hidden>
              <IconUser size={40} />
            </div>
          )}
          <span className="kyc-selfie-ready-badge">Selfie ready</span>
        </div>
        <div className="kyc-selfie-actions">
          <button type="button" className="kyc-selfie-btn kyc-selfie-btn--ghost" onClick={retake}>
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-selfie-capture">
      {mode === "idle" ? (
        <div className="kyc-selfie-idle">
          <button
            type="button"
            className="kyc-selfie-trigger"
            aria-label="Enable camera for selfie"
            onClick={() => void startCamera()}
          >
            <IconUser size={28} />
          </button>
          <div className="kyc-selfie-idle-copy">
            <p>Enable your camera or upload a photo of your face.</p>
            <div className="kyc-selfie-actions">
              <button type="button" className="kyc-selfie-btn" onClick={() => void startCamera()}>
                Enable camera
              </button>
              <button
                type="button"
                className="kyc-selfie-btn kyc-selfie-btn--ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "camera" ? (
        <div className="kyc-selfie-camera">
          <div className="kyc-selfie-video-wrap">
            <video
              ref={videoRef}
              className="kyc-selfie-video"
              playsInline
              muted
              autoPlay
              aria-label="Live camera preview"
            />
            {!cameraReady ? <p className="kyc-selfie-camera-loading">Starting camera…</p> : null}
          </div>
          <div className="kyc-selfie-actions">
            <button
              type="button"
              className="kyc-selfie-btn kyc-selfie-btn--capture"
              disabled={!cameraReady}
              onClick={captureFromCamera}
            >
              Capture
            </button>
            <button type="button" className="kyc-selfie-btn kyc-selfie-btn--ghost" onClick={retake}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {mode === "preview" || mode === "uploading" ? (
        <div className="kyc-selfie-preview">
          {previewUrl ? (
            <img src={previewUrl} alt="Selfie preview" className="kyc-selfie-preview-img" />
          ) : null}
          <p className="kyc-selfie-preview-hint">Check your face is clear and well lit before confirming.</p>
          <div className="kyc-selfie-actions">
            <button
              type="button"
              className="kyc-selfie-btn"
              disabled={mode === "uploading"}
              onClick={() => void confirmUpload()}
            >
              {mode === "uploading" ? "Uploading…" : "Use this photo"}
            </button>
            <button
              type="button"
              className="kyc-selfie-btn kyc-selfie-btn--ghost"
              disabled={mode === "uploading"}
              onClick={retake}
            >
              Retake
            </button>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="kyc-selfie-file-input"
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {error ? (
        <p className="kyc-selfie-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
