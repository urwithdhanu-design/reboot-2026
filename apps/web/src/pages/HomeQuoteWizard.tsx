import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Product, QuoteEstimate, QuoteSchema } from "../api";
import { PayQuoteButton } from "../components/PayQuoteButton";

const DEMO_ADDRESS = "BUCKINGHAM PALACE\nTHE MALL\nLONDON\nSW1A 1AA";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];

const ASSUMPTIONS_HOME = [
  "It doesn’t have any damage caused by subsidence.",
  "The walls are made of brick, stone or concrete.",
  "The roof doesn’t have wooden tiles or thatch.",
  "It was built after 1700.",
  "It isn’t a Grade 1 or Grade A listed building.",
  "You or anyone living with you have no unspent criminal convictions. We don’t mean things like speeding tickets or parking fines.",
];

const ASSUMPTIONS_MORE = [
  "It’s your main home. If shared, it’s with your family and/or up to two unrelated people only.",
  "If used for business, this is only computer work, paperwork and phone calls by you and anyone living with you.",
  "It won’t be left for longer than 60 days in a row with no one living there.",
  "It doesn’t have any building work taking place, or scheduled, costing more than £75,000.",
];

type Props = {
  product: Product;
  schema: QuoteSchema;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  wizardStep: number;
  setWizardStep: Dispatch<SetStateAction<number>>;
  showQuote: boolean;
  quote: QuoteEstimate | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onNext: (e: FormEvent) => void;
  onCancel: () => void;
  onContinueToPolicies: () => void;
};

export function HomeQuoteWizard({
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
  onCancel,
  onContinueToPolicies,
}: Props) {
  const totalSteps = schema.total_steps;
  const progress = showQuote ? 100 : (wizardStep / totalSteps) * 100;
  const addressText = (answers.address_line || DEMO_ADDRESS).trim();

  return (
    <div className="screen has-nav lloyds-screen">
      <header className="lloyds-header" role="banner">
        <div className="lloyds-header-brand">
          <BrandMark />
          <span>REBOOT 2026</span>
        </div>
        <div className="lloyds-secure">
          <LockIcon />
          <span>Safe &amp; Secure</span>
        </div>
      </header>
      <div
        className="lloyds-progress"
        role="progressbar"
        aria-label="Quote progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="lloyds-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {showQuote && quote ? (
        <div className="lloyds-body">
          <p className="lloyds-eyebrow">Home insurance</p>
          <h1 className="lloyds-h1">Your quote</h1>
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
          <PayQuoteButton quote={quote} label="Pay first premium" />
          <button
            className="btn-outline lloyds-cancel"
            type="button"
            onClick={onContinueToPolicies}
          >
            Save quote without paying
          </button>
          <PlatformSiteFooter />
        </div>
      ) : (
        <form className="lloyds-body" onSubmit={onNext}>
          {wizardStep === 1 ? <LandingStep /> : null}
          {wizardStep === 2 ? (
            <DetailsStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 3 ? (
            <AddressStep
              addressText={addressText}
              answers={answers}
              setAnswers={setAnswers}
            />
          ) : null}
          {wizardStep === 4 ? (
            <AssumptionsStep
              title="About you and your home"
              items={ASSUMPTIONS_HOME}
              field="assumptions_home"
              answers={answers}
              setAnswers={setAnswers}
            />
          ) : null}
          {wizardStep === 5 ? (
            <AssumptionsStep
              title="More about you and your home"
              items={ASSUMPTIONS_MORE}
              field="assumptions_more"
              answers={answers}
              setAnswers={setAnswers}
            />
          ) : null}
          {wizardStep === 6 ? (
            <CoverStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 7 ? (
            <YesNoStep
              title="Add a second policyholder?"
              subtitle="If you add a second policyholder, they'll be able to make changes to the policy, including cancel or renew it. They'll also be able to make a claim."
              field="second_policyholder"
              answers={answers}
              setAnswers={setAnswers}
            />
          ) : null}
          {wizardStep === 8 ? (
            <StartDateStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 9 ? (
            <ClaimsCountStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 10 ? (
            <ClaimDetailsStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 11 ? (
            <InsuranceYearsStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 12 ? (
            <AwayCoverStep answers={answers} setAnswers={setAnswers} />
          ) : null}
          {wizardStep === 13 ? (
            <HighValueStep answers={answers} setAnswers={setAnswers} />
          ) : null}

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          {wizardStep === 1 ? (
            <div className="lloyds-landing-ctas">
              <button type="button" className="btn-outline lloyds-retrieve" disabled>
                Retrieve an existing quote
              </button>
              <button type="submit" className="btn-primary btn-dark" disabled={submitting}>
                Get a quote
              </button>
              <button type="button" className="lloyds-text-link lloyds-cancel-link" onClick={onCancel}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="wizard-footer-nav">
              <button type="button" className="lloyds-prev" onClick={onBack} aria-label="Previous step">
                &lt; Previous
              </button>
              <div className="wizard-footer-actions">
                <button type="button" className="btn-outline lloyds-cancel" onClick={onCancel} aria-label="Cancel quote">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-dark"
                  disabled={submitting}
                  aria-label={
                    submitting
                      ? "Calculating quote"
                      : wizardStep === totalSteps
                        ? "Get quote"
                        : "Next step"
                  }
                >
                  {submitting ? "Calculating…" : wizardStep === totalSteps ? "Get quote" : "Next"}
                </button>
              </div>
            </div>
          )}

          <PlatformSiteFooter />
        </form>
      )}
    </div>
  );
}

function LandingStep() {
  const [openHow, setOpenHow] = useState(false);
  const [openSupport, setOpenSupport] = useState(false);

  return (
    <>
      <p className="lloyds-eyebrow">Home insurance</p>
      <h1 className="lloyds-h1">Get a quote</h1>

      <div className="trust-banner">
        <div>
          <strong>Reboot 2026 Insurance rated Excellent</strong>
          <span className="trust-date">February 2026</span>
        </div>
        <div className="trust-stars" aria-label="5 star rating">
          {"★★★★★"}
        </div>
      </div>

      <div className="apply-card">
        <h2>To apply you need to:</h2>
        <ul>
          <li>
            <CheckIcon /> live in the UK
          </li>
          <li>
            <CheckIcon /> be 18 or over
          </li>
          <li>
            <CheckIcon /> have a few minutes to apply
          </li>
        </ul>
      </div>

      <div className="lloyds-accordion">
        <button
          type="button"
          className="lloyds-accordion-btn"
          aria-expanded={openHow}
          aria-controls="how-decisions-panel"
          id="how-decisions-btn"
          onClick={() => setOpenHow((v) => !v)}
        >
          How we make decisions
          <span aria-hidden>{openHow ? "−" : "+"}</span>
        </button>
        {openHow ? (
          <p className="lloyds-accordion-body" id="how-decisions-panel" role="region" aria-labelledby="how-decisions-btn">
            We use the information you give us, along with data from other sources, to work out a
            fair price and decide what cover we can offer.
          </p>
        ) : null}
      </div>

      <div className="lloyds-accordion">
        <button
          type="button"
          className="lloyds-accordion-btn"
          aria-expanded={openSupport}
          aria-controls="extra-support-panel"
          id="extra-support-btn"
          onClick={() => setOpenSupport((v) => !v)}
        >
          Looking for extra support?
          <span aria-hidden>{openSupport ? "−" : "+"}</span>
        </button>
        {openSupport ? (
          <p className="lloyds-accordion-body" id="extra-support-panel" role="region" aria-labelledby="extra-support-btn">
            If you need help completing your quote, contact us or ask someone you trust to help
            you. We can offer alternative formats on request.
          </p>
        ) : null}
      </div>
    </>
  );
}

function DetailsStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const titles = ["Mr", "Mrs", "Miss", "Ms", "Mx", "Other"];
  return (
    <>
      <h1 className="lloyds-h1">Your details</h1>
      <p className="lloyds-sub">
        Make sure these match official documents, such as your passport or driving licence.
      </p>
      <p className="lloyds-label" id="title-label">
        Title
      </p>
      <div className="title-pills" role="group" aria-labelledby="title-label">
        {titles.map((t) => (
          <button
            key={t}
            type="button"
            className={answers.title === t ? "selected" : ""}
            aria-pressed={answers.title === t}
            onClick={() => setAnswers((prev) => ({ ...prev, title: t }))}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="first_name">First name</label>
        <div className="input-shell">
          <input
            id="first_name"
            value={answers.first_name ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, first_name: e.target.value }))}
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
            onChange={(e) => setAnswers((prev) => ({ ...prev, last_name: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <div className="input-shell">
          <input
            id="email"
            type="email"
            value={answers.email ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Date of birth</label>
        <div className="dob-row">
          <div className="input-shell">
            <input
              aria-label="Day"
              placeholder="DD"
              inputMode="numeric"
              maxLength={2}
              value={answers.dob_day ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, dob_day: e.target.value }))}
              required
            />
          </div>
          <div className="input-shell">
            <input
              aria-label="Month"
              placeholder="MM"
              inputMode="numeric"
              maxLength={2}
              value={answers.dob_month ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, dob_month: e.target.value }))}
              required
            />
          </div>
          <div className="input-shell">
            <input
              aria-label="Year"
              placeholder="YYYY"
              inputMode="numeric"
              maxLength={4}
              value={answers.dob_year ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, dob_year: e.target.value }))}
              required
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AddressStep({
  addressText,
  answers,
  setAnswers,
}: {
  addressText: string;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">Confirm your address</h1>
      <div className="lloyds-address-block">
        {addressText.split("\n").map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <p className="lloyds-label">Is this the property you wish to insure?</p>
      <YesNoToggle
        value={answers.address_confirmed ?? "Yes"}
        onChange={(v) => setAnswers((prev) => ({ ...prev, address_confirmed: v }))}
      />
    </>
  );
}

function AssumptionsStep({
  title,
  items,
  field,
  answers,
  setAnswers,
}: {
  title: string;
  items: string[];
  field: string;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">{title}</h1>
      <p className="lloyds-sub">We’ve assumed a few things about you and your home</p>
      <ul className="lloyds-check-list">
        {items.map((item) => (
          <li key={item}>
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="lloyds-label">Are all of these statements true?</p>
      <YesNoToggle
        value={answers[field] ?? "Yes"}
        onChange={(v) => setAnswers((prev) => ({ ...prev, [field]: v }))}
      />
    </>
  );
}

function CoverStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const options = [
    { label: "Buildings and Contents", icon: <UmbrellaIcon /> },
    { label: "Just Contents", icon: <RingIcon /> },
    { label: "Just Buildings", icon: <HouseIcon /> },
  ];
  return (
    <>
      <h1 className="lloyds-h1">Choose Your Cover</h1>
      <button type="button" className="lloyds-text-link">
        What type of cover should I choose?
      </button>
      <div className="cover-options">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            className={`cover-option${answers.cover_type === opt.label ? " selected" : ""}`}
            onClick={() => setAnswers((prev) => ({ ...prev, cover_type: opt.label }))}
          >
            <span className="cover-option-icon">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function YesNoStep({
  title,
  subtitle,
  field,
  answers,
  setAnswers,
}: {
  title: string;
  subtitle?: string;
  field: string;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">{title}</h1>
      {subtitle ? <p className="lloyds-sub">{subtitle}</p> : null}
      <YesNoToggle
        value={answers[field] ?? "Yes"}
        onChange={(v) => setAnswers((prev) => ({ ...prev, [field]: v }))}
      />
    </>
  );
}

function AwayCoverStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">Away from home cover</h1>
      <p className="lloyds-sub">
        Protect the things you have with you when you leave the house. It covers items worth
        £2,000 each or less like your phone, watch or bike. This includes students&apos; contents
        up to £5,000.
      </p>
      <p className="lloyds-sub">
        We&apos;ll ask you about anything worth more than £2,000 on the next page.
      </p>
      <p className="lloyds-label">Do you want to cover your things away from the home?</p>
      <YesNoToggle
        value={answers.away_cover ?? "Yes"}
        onChange={(v) => setAnswers((prev) => ({ ...prev, away_cover: v }))}
      />
    </>
  );
}

function HighValueStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">Items worth more than £2,000 each</h1>
      <p className="lloyds-label">
        Do you want to insure any items more than £2,000 each like TV’s, bikes, watches,
        jewellery and laptops?
      </p>
      <p className="lloyds-sub">
        You don&apos;t need to tell us about furniture unless it&apos;s antique. And you
        don&apos;t need to tell us about home appliances, like a washing machine or dishwasher.
      </p>
      <YesNoToggle
        value={answers.high_value_items ?? "No"}
        onChange={(v) => setAnswers((prev) => ({ ...prev, high_value_items: v }))}
      />
    </>
  );
}

function StartDateStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      <h1 className="lloyds-h1">Policy start date</h1>
      <p className="lloyds-sub">When do you want your policy to start?</p>
      <p className="lloyds-sub">Not sure? You can change this later before you buy</p>
      <div className="field">
        <label htmlFor="cover_start_date">Start date</label>
        <div className="input-shell">
          <input
            id="cover_start_date"
            type="date"
            value={answers.cover_start_date ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, cover_start_date: e.target.value }))
            }
            required
          />
        </div>
      </div>
    </>
  );
}

function ClaimsCountStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const options = ["0 claims", "1 claim", "2 claims", "3+ claims"];
  return (
    <>
      <h1 className="lloyds-h1">Your claims history</h1>
      <p className="lloyds-sub">How many paid claims have you had in the last 5 years?</p>
      <p className="lloyds-sub">
        By &apos;paid claim&apos; we mean you&apos;ve made a home insurance claim and received
        payment or had something fixed or replaced.
      </p>
      <div className="option-list">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={answers.claims_count === opt ? "selected" : ""}
            onClick={() => setAnswers((prev) => ({ ...prev, claims_count: opt }))}
          >
            {opt}
          </button>
        ))}
      </div>
    </>
  );
}

function ClaimDetailsStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const claims = answers.claims_count ?? "0 claims";
  const showSecond = claims.startsWith("2") || claims.startsWith("3");

  return (
    <>
      <h1 className="lloyds-h1">Claim details</h1>
      <p className="lloyds-sub">Tell us when your most recent claim(s) happened.</p>
      <ClaimMonthYear
        label="First claim"
        month={answers.claim1_month ?? ""}
        year={answers.claim1_year ?? ""}
        onMonth={(v) => setAnswers((prev) => ({ ...prev, claim1_month: v }))}
        onYear={(v) => setAnswers((prev) => ({ ...prev, claim1_year: v }))}
      />
      {showSecond ? (
        <ClaimMonthYear
          label="Second claim"
          month={answers.claim2_month ?? ""}
          year={answers.claim2_year ?? ""}
          onMonth={(v) => setAnswers((prev) => ({ ...prev, claim2_month: v }))}
          onYear={(v) => setAnswers((prev) => ({ ...prev, claim2_year: v }))}
        />
      ) : null}
    </>
  );
}

function ClaimMonthYear({
  label,
  month,
  year,
  onMonth,
  onYear,
}: {
  label: string;
  month: string;
  year: string;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="dob-row">
        <div className="input-shell">
          <select value={month} onChange={(e) => onMonth(e.target.value)}>
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="input-shell">
          <select value={year} onChange={(e) => onYear(e.target.value)}>
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function InsuranceYearsStep({
  answers,
  setAnswers,
}: {
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const options = [
    "I've never had home insurance",
    "1 year",
    "2 years",
    "3 years",
    "4 years",
    "5+ years",
  ];
  return (
    <>
      <h1 className="lloyds-h1">How long have you held home insurance?</h1>
      <div className="option-list">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={answers.insurance_years === opt ? "selected" : ""}
            onClick={() => setAnswers((prev) => ({ ...prev, insurance_years: opt }))}
          >
            {opt}
          </button>
        ))}
      </div>
    </>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="yes-no" role="group" aria-label="Yes or No">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          className={value === opt ? "selected" : ""}
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
        >
          {value === opt && opt === "Yes" ? <CheckIcon small /> : null}
          {opt}
        </button>
      ))}
    </div>
  );
}

function PlatformSiteFooter() {
  return (
    <footer className="lloyds-site-footer">
      <a href="#terms">Terms</a>
      <a href="#privacy">Privacy</a>
      <a href="#cookies">Cookies</a>
      <span>© Reboot 2026 Insurance</span>
    </footer>
  );
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.6-7 8.8-4.2-1.2-7-4.6-7-8.8V6.5l7-3Z" />
      <path d="m9 12 2.1 2.1L15.5 9.7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UmbrellaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" />
      <path d="M12 12v7a2 2 0 0 0 4 0" />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 9l1.5-4h3L15 9" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export const HOME_DEMO_ADDRESS = DEMO_ADDRESS;
