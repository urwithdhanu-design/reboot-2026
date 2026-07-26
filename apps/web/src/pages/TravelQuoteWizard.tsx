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

function isRoundTrip(tripType?: string) {
  return (tripType ?? "").toLowerCase().includes("round");
}

function renderField(
  field: QuoteField,
  answers: Record<string, string>,
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>,
  roundTrip: boolean,
) {
  const disabledReturn = field.name === "return_date" && !roundTrip;

  if (field.type === "select") {
    const onSelectChange = (value: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [field.name]: value };
        if (field.name === "trip_type" && !value.toLowerCase().includes("round")) {
          delete next.return_date;
        }
        return next;
      });
    };

    return (
      <div className="field" key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        <div className="input-shell">
          <select
            id={field.name}
            value={answers[field.name] ?? ""}
            onChange={(e) => onSelectChange(e.target.value)}
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
      <label htmlFor={field.name}>
        {field.label}
        {disabledReturn ? <span className="muted"> (not needed for single trip)</span> : null}
      </label>
      <div className="input-shell">
        <input
          id={field.name}
          type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type}
          placeholder={field.placeholder}
          value={answers[field.name] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))}
          required={field.required && !disabledReturn}
          disabled={disabledReturn}
        />
      </div>
    </div>
  );
}

export function TravelQuoteWizard({
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
  const roundTrip = isRoundTrip(answers.trip_type);
  const currentStep = schema.steps.find((s) => s.step === wizardStep) ?? schema.steps[0];
  const progress = showQuote ? 100 : (wizardStep / schema.total_steps) * 100;

  const selectedCover = useMemo(() => {
    const items: string[] = [];
    if (answers.coverage_flight_delay === "Yes") items.push("Flight delay");
    if (answers.coverage_cancellation === "Yes") items.push("Trip cancellation");
    return items;
  }, [answers.coverage_cancellation, answers.coverage_flight_delay]);

  return (
    <div className="screen has-nav travel-quote-screen">
      <header className="travel-quote-header">
        <button type="button" className="link-quiet" onClick={onBack}>
          ← Back
        </button>
        <span>Travel Protect Plus</span>
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
          <h1 className="section-title">Your travel quote</h1>
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
            <p className="options-label">Trip summary</p>
            <ul>
              <li>
                {answers.trip_type} to {answers.destination || "your destination"}
              </li>
              <li>
                Depart {answers.departure_date}
                {roundTrip && answers.return_date ? ` · Return ${answers.return_date}` : ""}
              </li>
              <li>Flight {answers.flight_number}</li>
              <li>Parametric cover: {selectedCover.join(", ") || "None"}</li>
            </ul>
            <p className="muted travel-parametric-note">
              After payment and policy minting, parametric rules are created automatically for your
              selected cover. Admins can simulate flight delay or cancellation from the Parametric console.
            </p>
          </div>

          <PayQuoteButton quote={quote} label="Pay premium" />
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
            <div className="travel-cover-cards" aria-label="Parametric cover options">
              <p className="options-label">Choose parametric cover</p>
              <div className="travel-cover-grid">
                <button
                  type="button"
                  className={`travel-cover-card${answers.coverage_flight_delay === "Yes" ? " active" : ""}`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      coverage_flight_delay: prev.coverage_flight_delay === "Yes" ? "No" : "Yes",
                    }))
                  }
                >
                  <strong>Flight delay</strong>
                  <span>Auto-payout when your flight is delayed beyond the threshold.</span>
                </button>
                <button
                  type="button"
                  className={`travel-cover-card${answers.coverage_cancellation === "Yes" ? " active" : ""}`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      coverage_cancellation: prev.coverage_cancellation === "Yes" ? "No" : "Yes",
                    }))
                  }
                >
                  <strong>Trip cancellation</strong>
                  <span>Cover if your trip is cancelled before departure.</span>
                </button>
              </div>
            </div>
          ) : null}

          {(currentStep?.fields ?? []).map((field) =>
            renderField(field, answers, setAnswers, roundTrip),
          )}

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
