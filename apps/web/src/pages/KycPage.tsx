import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { AssistantBar, StepHeader } from "../components";
import { IconDoc } from "../icons";
import { useSession } from "../session";

const STEPS = ["Identity", "Verify", "Liveness", "Complete"] as const;

export function KycPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useSession();
  const [documentType, setDocumentType] = useState("passport");
  const [uploaded, setUploaded] = useState(true);
  const [selfie, setSelfie] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(
    () => ({
      Identity: "done",
      Verify: uploaded ? "done" : "pending",
      Liveness: selfie ? "pending" : "pending",
      Complete: "pending",
    }),
    [uploaded, selfie],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.submitKyc(token, {
        document_type: documentType,
        document_uploaded: uploaded,
        selfie_captured: selfie,
      });
      if (user) {
        updateUser({ ...user, kyc_status: res.status });
      }
      navigate("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <StepHeader title="KYC Verification" />

      <div className="progress-block">
        <h3>KYC Progress</h3>
        <div className="progress-track">
          {STEPS.map((label, index) => {
            const done = progress[label] === "done" || index < 2;
            return (
              <div className="progress-step" key={label}>
                <div className={`progress-dot${done ? " done" : ""}`}>
                  {done ? "✓" : index === 2 ? "1" : "i"}
                </div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <div>
          <h2 className="section-title">Verify Your Identity</h2>
          <p className="section-sub">Take a clear photo of your document</p>
        </div>

        <div className="field">
          <label htmlFor="docType">Document Type</label>
          <div className="input-shell">
            <select
              id="docType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="passport">Passport</option>
              <option value="driving_licence">Driving Licence</option>
              <option value="national_id">National ID</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="upload-card"
          onClick={() => setUploaded(true)}
        >
          <div className="upload-icon">
            <IconDoc />
          </div>
          <div>
            <strong>Passport</strong>
            <div className="muted" style={{ fontSize: "0.82rem" }}>
              {uploaded ? "Front page ready" : "Upload front page"}
            </div>
          </div>
        </button>

        <div className="selfie-row">
          <div>
            <h2 className="section-title">Selfie Verification</h2>
            <p className="section-sub">Take a selfie to match your document</p>
          </div>
          <button
            type="button"
            className="selfie-avatar"
            aria-label="Capture selfie"
            onClick={() => setSelfie(true)}
            style={{
              background:
                "linear-gradient(145deg, #c8ddd3, #8fb9a5)",
              border: "3px solid #e6f3ee",
            }}
          />
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Continue"}
        </button>
      </form>

      <AssistantBar screen="kyc" />
    </div>
  );
}
