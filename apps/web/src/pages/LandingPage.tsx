import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../api";
import { BottomNav } from "../components";
import { KycOnboardingPrompt } from "../components/KycOnboardingPrompt";
import { LANDING_NAV, PRODUCT_MARKETING } from "../data/productMarketing";
import { productIcon } from "../icons";
import { useQuoteNavigation } from "../hooks/useQuoteNavigation";
import { needsKycAttention } from "../kycStatus";
import { useSession } from "../session";

const WHY_US = [
  {
    title: "Straightforward cover",
    body: "Clear policy wording, flexible excess, and no surprise fees on monthly pay.",
  },
  {
    title: "Support when it matters",
    body: "Claims guidance online or by phone, plus our AI assistant for quick answers.",
  },
  {
    title: "Trusted partners",
    body: "Products from selected underwriters, built for UK homes, health, and mobility.",
  },
] as const;

export function LandingPage() {
  const goQuote = useQuoteNavigation();
  const { token, user, updateUser } = useSession();
  const location = useLocation();
  const registrationNote = (location.state as { registrationNote?: string } | null)?.registrationNote;
  const kycSubmitted = (location.state as { kycSubmitted?: boolean } | null)?.kycSubmitted;
  const featured = PRODUCT_MARKETING[0];
  const loggedIn = Boolean(token);
  const showKycPrompt = loggedIn && needsKycAttention(user?.kyc_status);

  useEffect(() => {
    if (!token) return;
    void api
      .me(token)
      .then((res) => updateUser(res))
      .catch(() => undefined);
  }, [token, updateUser]);

  return (
    <div className={`screen marketing-screen landing-v2${loggedIn ? " has-nav screen-customer" : ""}`}>
      {registrationNote ? (
        <div className="landing-banner" role="status">
          {registrationNote}
        </div>
      ) : null}
      {kycSubmitted ? (
        <div className="landing-banner landing-banner-kyc" role="status">
          KYC submitted — we are reviewing your documents. You can check status anytime from home or your wallet.
        </div>
      ) : null}
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="Lloyds Banking Group Insurance home">
          <span className="landing-brand-mark" aria-hidden>
            LBG
          </span>
          <span className="landing-brand-text">
            <strong>Lloyds Banking Group</strong>
            <span>Insurance</span>
          </span>
        </Link>
        <div className="landing-header-actions">
          {loggedIn ? (
            <>
              <Link to="/policies" className="landing-btn-ghost">
                Policies
              </Link>
              <Link to="/profile" className="landing-btn-primary">
                {user?.full_name?.split(" ")[0] ?? "Account"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="landing-btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="landing-btn-primary">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      {showKycPrompt ? (
        <KycOnboardingPrompt status={user?.kyc_status} variant="banner" className="landing-kyc-prompt" />
      ) : null}

      <nav className="landing-nav" aria-label="Insurance products">
        <div className="landing-nav-track">
          {LANDING_NAV.map((item) => (
            <Link key={item.slug} to={`/products/${item.slug}`} className="landing-nav-pill">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <section className="landing-hero" aria-label="Insurance overview">
        <div className="landing-hero-media">
          <img
            src="/landing-hero.png"
            alt=""
            className="landing-hero-img"
          />
          <div className="landing-hero-scrim" aria-hidden />
        </div>
        <div className="landing-hero-content">
          <p className="landing-eyebrow">Personal insurance · UK</p>
          <h1>Insurance that feels clear, calm, and built around you</h1>
          <p className="landing-hero-lead">
            Cover your home, health, car, pets, travel and more — with simple quotes, trusted underwriters,
            and support when you need to claim.
          </p>
          <div className="landing-hero-ctas">
            <button
              type="button"
              className="landing-btn-primary landing-btn-lg"
              onClick={() => goQuote(featured?.productId ?? "home-insurance")}
            >
              Get a quote
            </button>
            <Link to={`/products/${featured?.slug ?? "home-insurance"}`} className="landing-btn-outline landing-btn-lg">
              Browse products
            </Link>
          </div>
          <ul className="landing-hero-badges" aria-label="Highlights">
            <li>FCA-regulated partners</li>
            <li>No hidden monthly fees</li>
            <li>24/7 claims support</li>
          </ul>
        </div>
      </section>

      <section className="landing-trust" aria-label="Customer ratings">
        <div className="landing-trust-copy">
          <span className="landing-trust-label">Rated excellent</span>
          <strong>Thousands of customers trust our insurance experience</strong>
          <span className="landing-trust-meta">Independent reviews · February 2026</span>
        </div>
        <div className="landing-trust-score" aria-label="5 star rating">
          <span className="landing-stars" aria-hidden>
            ★★★★★
          </span>
          <span className="landing-trust-provider">Trustpilot</span>
        </div>
      </section>

      <section className="landing-why" aria-labelledby="landing-why-title">
        <div className="landing-section-head">
          <h2 id="landing-why-title">Why choose us</h2>
          <p>Modern cover with the reassurance of a name you know.</p>
        </div>
        <div className="landing-why-grid">
          {WHY_US.map((item) => (
            <article key={item.title} className="landing-why-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-products" aria-labelledby="landing-products-title">
        <div className="landing-section-head">
          <h2 id="landing-products-title">Choose your cover</h2>
          <p>{loggedIn ? "Pick a product and get a tailored quote in minutes." : "Compare products, then sign in when you are ready for a tailored quote."}</p>
        </div>

        <div className="landing-product-grid">
          {PRODUCT_MARKETING.map((product) => (
            <article className="landing-product-card" key={product.slug}>
              <div className="landing-product-top">
                <div className="landing-product-icon" aria-hidden>
                  {productIcon(product.icon)}
                </div>
                <div>
                  <h3>{product.title}</h3>
                  <p className="landing-product-tagline">{product.tagline}</p>
                </div>
              </div>
              {product.partnerNote ? (
                <p className="landing-product-partner">{product.partnerNote}</p>
              ) : null}
              {product.bullets.length > 0 ? (
                <ul className="landing-product-bullets">
                  {product.bullets.slice(0, 2).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              <div className="landing-product-actions">
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => goQuote(product.productId)}
                >
                  Get a quote
                </button>
                <Link className="landing-btn-text" to={`/products/${product.slug}`}>
                  Learn more
                </Link>
              </div>
            </article>
          ))}

          <aside className="landing-gaps">
            <p className="landing-gaps-eyebrow">Protection check</p>
            <h3>Any gaps in your cover?</h3>
            <p>
              {loggedIn
                ? "Review your policies, compare options, and see what else you might need."
                : "Sign in to review policies, compare options, and see what else you might need."}
            </p>
            <ul>
              <li>See cover you already hold with us</li>
              <li>Spot overlaps and missing protection</li>
              <li>Get guided next steps in the app</li>
            </ul>
            <Link
              to={loggedIn ? "/policies" : "/login"}
              className="landing-btn-outline landing-btn-dark"
            >
              {loggedIn ? "Review my policies" : "Sign in to review"}
            </Link>
          </aside>
        </div>
      </section>

      <section className="landing-cta-band" aria-label="Get started">
        <div>
          <h2>Ready when you are</h2>
          <p>
            {loggedIn
              ? "Browse products, save quotes, and manage policies in one place."
              : "Create an account to save quotes, complete KYC, and manage policies in one place."}
          </p>
        </div>
        {loggedIn ? (
          <Link to="/policies" className="landing-btn-primary landing-btn-invert">
            My policies
          </Link>
        ) : (
          <Link to="/register" className="landing-btn-primary landing-btn-invert">
            Register free
          </Link>
        )}
      </section>

      <footer className="landing-footer">
        <p>
          Limits, terms and exclusions apply.
          {loggedIn
            ? " Quotes are tailored to your account details."
            : " Quotes require an account — we will ask you to log in or register when you continue."}
        </p>
        <div className="landing-footer-links">
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
          <Link to="/forgot-password">Forgot password</Link>
        </div>
      </footer>
      {loggedIn ? <BottomNav active="home" /> : null}
    </div>
  );
}
