import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getProductBySlug, LANDING_NAV } from "../data/productMarketing";
import { useQuoteNavigation } from "../hooks/useQuoteNavigation";
import { IconHome, IconUmbrella, productIcon } from "../icons";

function CoverIcon({ type }: { type: "umbrella" | "home" | "ring" }) {
  if (type === "umbrella") return <IconUmbrella size={28} />;
  if (type === "home") return <IconHome size={28} />;
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="14" r="4" />
      <circle cx="12" cy="8" r="2.2" />
      <path d="M14.2 6.2 16 4.5" />
    </svg>
  );
}

export function ProductMarketingPage() {
  const { slug = "" } = useParams();
  const product = getProductBySlug(slug);
  const goQuote = useQuoteNavigation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openExtras, setOpenExtras] = useState(true);
  const [openLevels, setOpenLevels] = useState(true);
  const [openTypes, setOpenTypes] = useState(true);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="screen marketing-screen">
      <header className="mkt-topbar">
        <Link to="/" className="mkt-brand">
          <strong>Lloyds Banking Group</strong>
          <span>Insurance</span>
        </Link>
        <div className="mkt-auth-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="mkt-link-strong">
            Register
          </Link>
        </div>
      </header>

      <nav className="mkt-nav" aria-label="Insurance products">
        {LANDING_NAV.map((item) => (
          <Link
            key={item.slug}
            to={`/products/${item.slug}`}
            className={item.slug === slug ? "active" : undefined}
            aria-current={item.slug === slug ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="mkt-product-hero-card" aria-label={`${product.title} offer`}>
        <div className="mkt-product-hero">
          <div className="mkt-product-hero-panel">
            <h1>{product.heroHeadline}</h1>
            <ul className="mkt-check-list">
              {product.heroPoints.map((point) => (
                <li key={point}>
                  <span className="mkt-check" aria-hidden>
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mkt-product-hero-actions">
              <button
                type="button"
                className="mkt-btn-white"
                onClick={() => goQuote(product.productId)}
              >
                Get quote
              </button>
              <button
                type="button"
                className="mkt-btn-ghost"
                onClick={() => goQuote(product.productId)}
              >
                Retrieve quote
              </button>
            </div>
          </div>
          <figure className="mkt-product-hero-photo">
            {product.heroImage ? (
              <img
                src={product.heroImage}
                alt=""
                role="presentation"
              />
            ) : (
              <div
                className={`mkt-photo-fallback mkt-photo-${product.icon}`}
                aria-hidden
              />
            )}
          </figure>
        </div>

        <div className="trust-banner mkt-trust">
          <div>
            Our insurance services are rated <strong>excellent</strong> on Trustpilot.
            February 2026.
          </div>
          <div className="trust-stars" aria-label="5 star Trustpilot rating">
            ★★★★★
          </div>
        </div>
      </section>

      <div className="mkt-action-cards">
        <article className="mkt-action-card">
          <div className="mkt-action-icon">{productIcon("home")}</div>
          <h3>Manage your policy</h3>
          <p>Existing customers can amend, renew and cancel their policy online.</p>
          <Link to="/login" className="mkt-btn-outline">
            Manage your policy
          </Link>
        </article>
        <article className="mkt-action-card">
          <div className="mkt-action-icon">{productIcon("cross")}</div>
          <h3>Make a claim</h3>
          <p>Claim online and we&apos;ll process it just as we would if you&apos;d called us.</p>
          <Link to="/login" className="mkt-btn-outline">
            Make a claim
          </Link>
        </article>
      </div>

      {product.coverTypes ? (
        <section className="mkt-block">
          <h2 className="mkt-section-title">We offer three types of {product.title.toLowerCase()}</h2>
          <button
            type="button"
            className="mkt-accordion-head"
            aria-expanded={openTypes}
            aria-controls="cover-types-panel"
            id="cover-types-btn"
            onClick={() => setOpenTypes((v) => !v)}
          >
            What type of policy do you need?
            <span aria-hidden>{openTypes ? "⌃" : "⌄"}</span>
          </button>
          {openTypes ? (
            <div className="mkt-cover-grid" id="cover-types-panel" role="region" aria-labelledby="cover-types-btn">
              {product.coverTypes.map((cover) => (
                <article className="mkt-cover-card" key={cover.title}>
                  <div className="mkt-cover-icon">
                    <CoverIcon type={cover.icon} />
                  </div>
                  <h3>{cover.title}</h3>
                  <p>{cover.body}</p>
                  <button
                    type="button"
                    className="mkt-text-chevron"
                    onClick={() => goQuote(product.productId)}
                  >
                    {cover.link} &gt;
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {product.coverLevels ? (
        <section className="mkt-block">
          <h2 className="mkt-section-title">We offer three levels of cover</h2>
          <button
            type="button"
            className="mkt-accordion-head"
            aria-expanded={openLevels}
            aria-controls="cover-levels-panel"
            id="cover-levels-btn"
            onClick={() => setOpenLevels((v) => !v)}
          >
            What&apos;s covered in Bronze, Silver and Gold?
            <span aria-hidden>{openLevels ? "⌃" : "⌄"}</span>
          </button>
          {openLevels ? (
            <div id="cover-levels-panel" role="region" aria-labelledby="cover-levels-btn">
              <div className="mkt-info-box">
                <p>
                  Full policy wording and limits are in our documents. Limits, terms and exclusions
                  apply.
                </p>
                <p className="mkt-pdf-links">
                  <span>policy document (PDF)</span>
                  <span>policy limits (PDF)</span>
                </p>
              </div>
              <div className="mkt-table-wrap">
                <table className="mkt-compare-table">
                  <thead>
                    <tr>
                      <th>Cover limits</th>
                      <th>Bronze</th>
                      <th>Silver</th>
                      <th>Gold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.coverLevels.rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>{row.bronze}</td>
                        <td>{row.silver}</td>
                        <td>{row.gold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {product.extrasItems ? (
        <section className="mkt-block">
          <h2 className="mkt-serif-title">We offer additional features and optional extras</h2>
          <button
            type="button"
            className="mkt-accordion-head bordered"
            aria-expanded={openExtras}
            aria-controls="extras-panel"
            id="extras-btn"
            onClick={() => setOpenExtras((v) => !v)}
          >
            {product.extrasTitle}
            <span aria-hidden>{openExtras ? "⌃" : "⌄"}</span>
          </button>
          {openExtras ? (
            <ul className="mkt-extras-list" id="extras-panel" role="region" aria-labelledby="extras-btn">
              {product.extrasItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="mkt-why">
        <h2 className="mkt-serif-title centered">
          Why choose Lloyds Banking {product.title.toLowerCase()}?
        </h2>
        <div className="mkt-why-grid">
          {product.whyChoose.map((item) => (
            <article className="mkt-why-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mkt-limits-note">Limits, terms and exclusions apply to all levels of cover.</p>
      </section>

      <section className="mkt-cta-banner">
        <div className="mkt-cta-lock" aria-hidden>
          🔒
        </div>
        <div>
          <strong>Ready to get a quote?</strong>
          <p>Pay monthly without any extra fees.</p>
        </div>
        <button type="button" className="mkt-btn-white compact" onClick={() => goQuote(product.productId)}>
          Get a quote
        </button>
      </section>

      <section className="mkt-help">
        <h2 className="mkt-serif-title centered">Help and guidance</h2>
        <div className="mkt-faq-list">
          {product.faqs.map((faq, idx) => (
            <div key={faq.q} className="mkt-faq-item">
              <button
                type="button"
                className="mkt-faq-q"
                aria-expanded={openFaq === idx}
                aria-controls={`faq-panel-${idx}`}
                id={`faq-btn-${idx}`}
                onClick={() => setOpenFaq((v) => (v === idx ? null : idx))}
              >
                {faq.q}
                <span aria-hidden>{openFaq === idx ? "⌃" : "⌄"}</span>
              </button>
              {openFaq === idx ? (
                <p className="mkt-faq-a" id={`faq-panel-${idx}`} role="region" aria-labelledby={`faq-btn-${idx}`}>
                  {faq.a}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <Link to="/" className="mkt-text-chevron">
          More on help and guidance &gt;
        </Link>
      </section>

      <section className="mkt-also">
        <h2 className="mkt-serif-title centered">You may also like</h2>
        <div className="mkt-also-grid">
          {product.alsoLike.map((item) => (
            <article className="mkt-also-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link to={`/products/${item.slug}`} className="mkt-text-chevron">
                {item.link} &gt;
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
