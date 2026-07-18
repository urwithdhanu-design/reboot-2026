import { Link } from "react-router-dom";
import { LANDING_NAV, PRODUCT_MARKETING } from "../data/productMarketing";
import { productIcon } from "../icons";
import { useQuoteNavigation } from "../hooks/useQuoteNavigation";

export function LandingPage() {
  const goQuote = useQuoteNavigation();

  return (
    <div className="screen marketing-screen">
      <header className="mkt-topbar">
        <div className="mkt-brand">
          <strong>Lloyds Banking Group</strong>
          <span>Insurance</span>
        </div>
        <div className="mkt-auth-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="mkt-link-strong">
            Register
          </Link>
        </div>
      </header>

      <nav className="mkt-nav" aria-label="Insurance products">
        {LANDING_NAV.map((item) => (
          <Link key={item.slug} to={`/products/${item.slug}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="mkt-hero-split" aria-label="Insurance overview">
        <div className="mkt-hero-copy">
          <h1>Get insurance that gives reassurance</h1>
          <p>
            Protect what matters most. Get cover for your home, health, car, pets and more
            from our selected underwriters.
          </p>
        </div>
        <div className="mkt-hero-photo">
          <img
            src="/landing-hero.png"
            alt="A young woman smiling with her eyes closed as she is held in a reassuring embrace"
          />
        </div>
      </section>

      <div className="trust-banner mkt-trust">
        <div>
          <strong>
            Our insurance services are rated <em>excellent</em> on Trustpilot.
          </strong>
          <span className="trust-date">February 2026</span>
        </div>
        <div className="trust-stars" aria-label="5 star Trustpilot rating">
          ★★★★★
          <span className="trust-word">Trustpilot</span>
        </div>
      </div>

      <h2 className="mkt-section-title">Choose from our insurance products</h2>

      <div className="promo-list mkt-product-grid">
        {PRODUCT_MARKETING.map((product) => (
          <article className="promo-card" key={product.slug}>
            <div className="promo-icon" aria-hidden>
              {productIcon(product.icon)}
            </div>
            <h3>{product.title}</h3>
            <p className="promo-tagline">{product.tagline}</p>
            {product.partnerNote ? (
              <p className="promo-partner">{product.partnerNote}</p>
            ) : null}
            {product.bullets.length > 0 ? (
              <ul className="promo-bullets">
                {product.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            <div className="mkt-card-actions">
              <Link className="promo-cta mkt-cta-link" to={`/products/${product.slug}`}>
                Learn more
              </Link>
              <button
                type="button"
                className="promo-cta"
                onClick={() => goQuote(product.productId)}
              >
                {product.title}
              </button>
            </div>
          </article>
        ))}

        <aside className="gaps-banner mkt-gaps">
          <h3>Any gaps in your protection?</h3>
          <p>We have help for you within our app.</p>
          <ul>
            <li>Understand the cover you already have with us.</li>
            <li>Find out how to protect yourself and your loved ones.</li>
          </ul>
        </aside>
      </div>

      <p className="mkt-footnote">
        Limits, terms and exclusions apply. Quotes require an account — we’ll ask you to log in
        or register when you’re ready.
      </p>
    </div>
  );
}
