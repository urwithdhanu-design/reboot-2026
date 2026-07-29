import { useMemo, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Product, QuoteEstimate, QuoteField, QuoteSchema } from "../api";
import { PayQuoteButton } from "../components/PayQuoteButton";

type Props = {
  product: Product;
  schema: QuoteSchema;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  wizardStep: number;
  showQuote: boolean;
  quote: QuoteEstimate | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onNext: (e: FormEvent) => void;
};

function renderField(
  field: QuoteField,
  answers: Record<string, string>,
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>,
) {
  if (field.type === "select") {
    return (
      <div className="field" key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        <div className="input-shell">
          <select
            id={field.name}
            value={answers[field.name] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))}
            required={field.required}
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="field" key={field.name}>
      <label htmlFor={field.name}>{field.label}</label>
      <div className="input-shell">
        <input
          id={field.name}
          type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type}
          placeholder={field.placeholder}
          value={answers[field.name] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))}
          required={field.required}
        />
      </div>
    </div>
  );
}

export function MotorQuoteWizard({
  schema,
  answers,
  setAnswers,
  wizardStep,
  showQuote,
  quote,
  submitting,
  error,
  onBack,
  onNext,
}: Props) {
  const currentStep = schema.steps.find((s) => s.step === wizardStep) ?? schema.steps[0];
  const progress = showQuote ? 100 : (wizardStep / schema.total_steps) * 100;

  const telematicsEnabled = useMemo(
    () => answers.coverage_accident_detection === "Yes",
    [answers.coverage_accident_detection],
  );

  return (
    <div className="screen has-nav travel-quote-screen">
      <header className="travel-quote-header">
        <button type="button" className="link-quiet" onClick={onBack}>
          ← Back
        </button>
        <span>Motor Protect Plus</span>
      </header>

      <div
        className="lloyds-progress"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="lloyds-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {showQuote && quote ? (
        <div className="travel-quote-body">
          <h1 className="section-title">Your motor quote</h1>
          <div className="quote-card">
            <span className="muted">Estimated premium</span>
            <strong>
              £{quote.estimated_premium.toFixed(2)}
              <span> / {quote.price_unit}</span>
            </strong>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              {quote.product_title} · {quote.quote_id}
            </p>
          </div>

          <div className="travel-cover-summary">
            <p className="options-label">Cover summary</p>
            <ul>
              <li>
                {answers.vehicle_type || "Vehicle"} · {answers.vehicle_reg}
              </li>
              <li>
                {answers.cover_type} cover from {answers.cover_start_date}
              </li>
              <li>Telematics device: {answers.telematics_device_id}</li>
              <li>
                IoT accident detection: {telematicsEnabled ? "Enabled" : "Not selected"}
              </li>
              {telematicsEnabled ? (
                <>
                  <li>Emergency parametric payout: £500 per verified impact (≥3.0g)</li>
                  <li>Policy coverage limit: £2,000</li>
                </>
              ) : null}
            </ul>
            <p className="muted travel-parametric-note">
              After payment and policy minting, a telematics accident rule is created automatically.
              Admins can simulate IoT impact events from the Parametric console to trigger emergency payouts.
            </p>
          </div>

          <PayQuoteButton quote={quote} />
        </div>
      ) : (
        <form className="travel-quote-body stack" onSubmit={onNext}>
          <div>
            <p className="travel-step-eyebrow">
              Step {wizardStep} of {schema.total_steps}
            </p>
            <h1 className="section-title">{currentStep?.title}</h1>
            {currentStep?.subtitle ? <p className="section-sub">{currentStep.subtitle}</p> : null}
          </div>

          {wizardStep === 2 ? (
            <div className="travel-cover-cards" aria-label="Telematics cover options">
              <p className="options-label">IoT accident detection</p>
              <div className="travel-cover-grid">
                <button
                  type="button"
                  className={`travel-cover-card${telematicsEnabled ? " active" : ""}`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      coverage_accident_detection: "Yes",
                    }))
                  }
                >
                  <strong>Telematics accident detection</strong>
                  <span>
                    Auto emergency payout when onboard sensors detect impact ≥3.0g — up to £500 per event.
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {(currentStep?.fields ?? []).map((field) => renderField(field, answers, setAnswers))}

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Calculating…" : wizardStep < schema.total_steps ? "Continue" : "Show my quote"}
          </button>
        </form>
      )}
    </div>
  );
}
