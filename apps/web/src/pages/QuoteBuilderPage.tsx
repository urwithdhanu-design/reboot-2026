import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  api,
  type Product,
  type QuoteEstimate,
  type QuoteField,
  type QuoteSchema,
} from "../api";
import { saveQuoteToCompare } from "../compareBasket";
import { AssistantBar, BottomNav, StepHeader } from "../components";
import { PayQuoteButton } from "../components/PayQuoteButton";
import { productIcon } from "../icons";
import { HOME_DEMO_ADDRESS, HomeQuoteWizard } from "./HomeQuoteWizard";

export function QuoteBuilderPage() {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [schema, setSchema] = useState<QuoteSchema | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wizardStep, setWizardStep] = useState(1);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postcodeThanks, setPostcodeThanks] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .getProduct(productId)
      .then(async (prod) => {
        const quoteSchema = await api.getQuoteSchema(prod.category);
        if (!alive) return;
        setProduct(prod);
        setSchema(quoteSchema);
        const defaults: Record<string, string> = {};
        const isHome =
          quoteSchema.flow === "wizard" && quoteSchema.category === "Property";

        for (const field of quoteSchema.fields) {
          if (field.name === "cover_start_date") {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            defaults[field.name] = d.toISOString().slice(0, 10);
          } else if (isHome && field.name === "address_line") {
            defaults[field.name] = HOME_DEMO_ADDRESS;
          } else if (isHome && field.name === "cover_type") {
            defaults[field.name] = "Buildings and Contents";
          } else if (isHome && field.name === "claims_count") {
            defaults[field.name] = "0 claims";
          } else if (
            isHome &&
            (field.name === "address_confirmed" ||
              field.name === "assumptions_home" ||
              field.name === "assumptions_more" ||
              field.name === "second_policyholder" ||
              field.name === "away_cover" ||
              field.name === "high_value_items")
          ) {
            defaults[field.name] = "Yes";
          } else if (
            isHome &&
            (field.name === "claim1_month" ||
              field.name === "claim1_year" ||
              field.name === "claim2_month" ||
              field.name === "claim2_year")
          ) {
            defaults[field.name] = "";
          } else if (field.type === "select" && field.options?.length) {
            defaults[field.name] = field.options[0];
          } else if (field.type === "radio_cards" && field.options?.length) {
            defaults[field.name] = field.options[0];
          } else {
            defaults[field.name] = "";
          }
        }
        setAnswers(defaults);
        setWizardStep(1);
        setShowQuote(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load quote builder");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [productId]);

  const currentStep = useMemo(
    () => schema?.steps.find((s) => s.step === wizardStep) ?? null,
    [schema, wizardStep],
  );

  const isHealthWizard = schema?.flow === "wizard" && schema.category === "Health";
  const isHomeWizard = schema?.flow === "wizard" && schema.category === "Property";
  const totalSteps = schema?.total_steps ?? 2;
  const firstName = answers.first_name?.trim() || "there";

  async function submitQuote() {
    if (!product) return;
    setSubmitting(true);
    setError(null);
    try {
      const estimated = await api.estimateQuote({
        product_id: product.id,
        answers,
      });
      saveQuoteToCompare(estimated);
      setQuote(estimated);
      setShowQuote(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not estimate quote");
    } finally {
      setSubmitting(false);
    }
  }

  function nextHomeStep(from: number): number {
    let next = from + 1;
    if (next === 10 && (answers.claims_count ?? "").startsWith("0")) {
      next = 11;
    }
    return next;
  }

  function prevHomeStep(from: number): number {
    let prev = from - 1;
    if (prev === 10 && (answers.claims_count ?? "").startsWith("0")) {
      prev = 9;
    }
    return prev;
  }

  function onNextStep(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schema) return;

    if (!isHealthWizard && !isHomeWizard) {
      void submitQuote();
      return;
    }

    if (!currentStep) return;

    // Landing step has no required fields
    if (!(isHomeWizard && wizardStep === 1)) {
      for (const field of currentStep.fields) {
        if (field.required && !String(answers[field.name] ?? "").trim()) {
          setError(`Please complete: ${field.label}`);
          return;
        }
      }
    }

    if (isHealthWizard && wizardStep === 1) {
      const age = ageFromDob(answers.dob_day, answers.dob_month, answers.dob_year);
      if (age === null) {
        setError("Enter a valid date of birth");
        return;
      }
      if (age < 18 || age > 79) {
        setError("To buy a plan, you must be between 18 and 79 years old");
        return;
      }
    }

    if (isHomeWizard && wizardStep === 2) {
      const age = ageFromDob(answers.dob_day, answers.dob_month, answers.dob_year);
      if (age === null) {
        setError("Enter a valid date of birth");
        return;
      }
      if (age < 18) {
        setError("You must be 18 or over to get a home insurance quote");
        return;
      }
    }

    if (wizardStep < totalSteps) {
      if (isHomeWizard) {
        setWizardStep((s) => nextHomeStep(s));
      } else {
        setWizardStep((s) => s + 1);
      }
      return;
    }
    void submitQuote();
  }

  function onBack() {
    setError(null);
    if (showQuote) {
      setShowQuote(false);
      return;
    }
    if (wizardStep > 1) {
      if (isHomeWizard) {
        setWizardStep((s) => prevHomeStep(s));
      } else {
        setWizardStep((s) => s - 1);
      }
      return;
    }
    navigate("/marketplace");
  }

  if (loading) {
    return (
      <div className="screen has-nav">
        <StepHeader title="Quote Builder" />
        <p className="muted">Loading quote builder…</p>
        <BottomNav active="home" />
      </div>
    );
  }

  if (!product || !schema) {
    return (
      <div className="screen has-nav">
        <StepHeader title="Quote Builder" />
        <p className="error" role="alert">
          {error ?? "Product not found"}
        </p>
        <Link to="/marketplace" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
          Back to marketplace
        </Link>
        <BottomNav active="home" />
      </div>
    );
  }

  if (isHomeWizard) {
    return (
      <HomeQuoteWizard
        product={product}
        schema={schema}
        answers={answers}
        setAnswers={setAnswers}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        showQuote={showQuote}
        quote={quote}
        submitting={submitting}
        error={error}
        onBack={onBack}
        onNext={onNextStep}
        onCancel={() => navigate("/marketplace")}
        onContinueToPolicies={() => navigate("/policies", { state: { quote } })}
      />
    );
  }

  if (showQuote && quote) {
    return (
      <div className="screen has-nav">
        <div className="vitality-top">
          <button type="button" className="back-link" onClick={onBack}>
            ← Back
          </button>
          <div className="partner-logos">
            <span className="lloyds-mark">REBOOT 2026</span>
            <span className="vitality-mark">Vitality</span>
          </div>
        </div>
        <div className="progress-rail">
          <div className="progress-fill" style={{ width: "100%" }} />
        </div>
        <p className="step-caption">Quote ready</p>
        <div className="quote-card">
          <span className="muted">Your Estimated Quote</span>
          <strong>
            £{quote.estimated_premium.toFixed(2)}
            <span> / {quote.price_unit}</span>
          </strong>
          <p className="muted" style={{ margin: 0 }}>
            {quote.product_title} · {quote.quote_id}
          </p>
        </div>
        <div className="quote-summary">
          <h3 className="section-title">Summary</h3>
          {Object.entries(answers)
            .filter(([, v]) => v)
            .map(([key, value]) => (
              <div className="row-between quote-summary-row" key={key}>
                <span className="muted">{labelFor(schema.fields, key)}</span>
                <strong>{value}</strong>
              </div>
            ))}
        </div>
        <PayQuoteButton quote={quote} label="Pay first premium" />
        <button
          className="btn-secondary"
          type="button"
          onClick={() => navigate("/policies", { state: { quote } })}
        >
          Save quote without paying
        </button>
        <BottomNav active="home" />
      </div>
    );
  }

  if (isHealthWizard && currentStep) {
    const heading =
      wizardStep === 2
        ? `Thanks ${firstName}. What's your postcode?`
        : currentStep.title;

    return (
      <div className="screen has-nav vitality-screen">
        <div className="vitality-top">
          <button type="button" className="back-link" onClick={onBack}>
            ← Back
          </button>
          <div className="partner-logos">
            <span className="lloyds-mark">REBOOT 2026</span>
            <span className="vitality-mark">Vitality</span>
          </div>
        </div>

        <div className="progress-rail">
          <div
            className="progress-fill"
            style={{ width: `${(wizardStep / totalSteps) * 100}%` }}
          />
        </div>
        <p className="step-caption">
          Step {wizardStep} of {totalSteps}
        </p>

        <h1 className="vitality-heading">{heading}</h1>
        {currentStep.subtitle && wizardStep !== 2 ? (
          <p className="vitality-sub">{currentStep.subtitle}</p>
        ) : null}

        <form className="stack vitality-form" onSubmit={onNextStep}>
          {wizardStep === 1 ? (
            <HealthStepOne answers={answers} setAnswers={setAnswers} />
          ) : null}

          {wizardStep === 2 ? (
            <div className="field">
              <label htmlFor="postcode">Postcode</label>
              <div className={`input-shell${postcodeThanks ? " valid" : ""}`}>
                <input
                  id="postcode"
                  value={answers.postcode ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setAnswers((prev) => ({ ...prev, postcode: value }));
                    setPostcodeThanks(value.trim().length >= 5);
                  }}
                  required
                />
              </div>
              {postcodeThanks ? (
                <p className="thanks-msg">✓ Thanks for that!</p>
              ) : null}
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div className="radio-cards">
              {(currentStep.fields[0]?.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`radio-card${answers.cover_who === opt ? " selected" : ""}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, cover_who: opt }))}
                >
                  <span className="radio-dot" />
                  {opt}
                </button>
              ))}
            </div>
          ) : null}

          {wizardStep === 4 ? (
            <div className="field">
              <label htmlFor="cover_start_date">Cover Start Date</label>
              <div className="input-shell">
                <input
                  id="cover_start_date"
                  type="date"
                  value={answers.cover_start_date ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      cover_start_date: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          ) : null}

          {wizardStep === 5 ? (
            <>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-shell">
                  <input
                    id="email"
                    type="email"
                    value={answers.email ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <div className="input-shell">
                  <input
                    id="phone"
                    type="tel"
                    value={answers.phone ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="btn-primary btn-dark"
            type="submit"
            disabled={submitting || (wizardStep === 5 && (!answers.email || !answers.phone))}
          >
            {submitting
              ? "Calculating…"
              : wizardStep === 5
                ? "Show my quote"
                : "Next"}
          </button>
        </form>

        <p className="vitality-footer">
          © Reboot 2026 Insurance. Health Plan brought to you in partnership with Vitality.
          VitalityHealth and VitalityLife are trading names of Vitality Corporate Services Limited.
        </p>
        <BottomNav active="home" />
      </div>
    );
  }

  // Default form flow for Travel / Vehicle / Pet / Life
  return (
    <div className="screen has-nav">
      <StepHeader title={`${product.category} Quote Builder`} />
      <div className="quote-product">
        <div className="product-icon">{productIcon(product.icon)}</div>
        <div>
          <h2 className="section-title">{product.title}</h2>
          <p className="section-sub">{product.description}</p>
        </div>
      </div>
      <form className="stack" onSubmit={onNextStep}>
        {(schema.fields ?? []).map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <div className="input-shell">
              {field.type === "select" ? (
                <select
                  id={field.name}
                  value={answers[field.name] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  required={field.required}
                >
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type === "email" || field.type === "tel" ? field.type : field.type}
                  placeholder={field.placeholder}
                  value={answers[field.name] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  required={field.required}
                />
              )}
            </div>
          </div>
        ))}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Calculating…" : "Continue"}
        </button>
      </form>
      <AssistantBar screen="marketplace" />
      <BottomNav active="home" />
    </div>
  );
}

function HealthStepOne({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="title">Title</label>
        <div className="input-shell">
          <select
            id="title"
            value={answers.title ?? "Mr"}
            onChange={(e) => setAnswers((prev) => ({ ...prev, title: e.target.value }))}
          >
            {["Mr", "Mrs", "Miss", "Ms", "Dr", "Mx"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="first_name">First name</label>
        <div className="input-shell">
          <input
            id="first_name"
            value={answers.first_name ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, first_name: e.target.value }))
            }
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="last_name">Last name</label>
        <div className="input-shell">
          <input
            id="last_name"
            value={answers.last_name ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, last_name: e.target.value }))
            }
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Date of birth</label>
        <p className="section-sub">To buy a plan, you must be between 18 and 79 years old</p>
        <div className="dob-row">
          <div className="input-shell">
            <input
              aria-label="Day"
              placeholder="Day"
              inputMode="numeric"
              maxLength={2}
              value={answers.dob_day ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, dob_day: e.target.value }))
              }
              required
            />
          </div>
          <div className="input-shell">
            <input
              aria-label="Month"
              placeholder="Month"
              inputMode="numeric"
              maxLength={2}
              value={answers.dob_month ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, dob_month: e.target.value }))
              }
              required
            />
          </div>
          <div className="input-shell">
            <input
              aria-label="Year"
              placeholder="Year"
              inputMode="numeric"
              maxLength={4}
              value={answers.dob_year ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, dob_year: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>
    </>
  );
}

function labelFor(fields: QuoteField[], name: string) {
  return fields.find((f) => f.name === name)?.label ?? name.replaceAll("_", " ");
}

function ageFromDob(day: string, month: string, year: string): number | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return null;
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}
