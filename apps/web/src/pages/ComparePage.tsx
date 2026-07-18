import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Product, type QuoteEstimate } from "../api";
import { AssistantBar, BottomNav, StepHeader } from "../components";
import {
  mergeCompareQuotes,
  readCompareQuotes,
  removeQuoteFromCompare,
} from "../compareBasket";

const MAX_SELECT = 3;

type Mode = "plans" | "quotes";

function formatMoney(amount: number, currency = "GBP") {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

function answerLabel(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toggleId(list: string[], id: string, max = MAX_SELECT) {
  if (list.includes(id)) return list.filter((item) => item !== id);
  if (list.length >= max) return list;
  return [...list, id];
}

export function ComparePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("plans");
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<QuoteEstimate[]>(() => readCompareQuotes());
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [category, setCategory] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.listProducts(), api.listQuotes().catch(() => ({ quotes: [], count: 0 }))])
      .then(([productRes, quoteRes]) => {
        if (!alive) return;
        setProducts(productRes.products);
        const merged = mergeCompareQuotes(quoteRes.quotes ?? []);
        setQuotes(merged);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load compare data");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filteredPlans = useMemo(() => {
    if (category === "All") return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  const selectedPlanItems = useMemo(
    () => products.filter((p) => selectedPlans.includes(p.id)),
    [products, selectedPlans],
  );

  const selectedQuoteItems = useMemo(
    () => quotes.filter((q) => selectedQuotes.includes(q.quote_id)),
    [quotes, selectedQuotes],
  );

  const quoteAnswerKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const quote of selectedQuoteItems) {
      Object.keys(quote.answers ?? {}).forEach((key) => {
        if (!["email", "phone", "first_name", "last_name", "title"].includes(key)) {
          keys.add(key);
        }
      });
    }
    return Array.from(keys).slice(0, 8);
  }, [selectedQuoteItems]);

  function onSelectPlan(id: string) {
    setSelectedPlans((prev) => toggleId(prev, id));
  }

  function onSelectQuote(id: string) {
    setSelectedQuotes((prev) => toggleId(prev, id));
  }

  function onRemoveQuote(id: string) {
    setQuotes(removeQuoteFromCompare(id));
    setSelectedQuotes((prev) => prev.filter((item) => item !== id));
  }

  return (
    <div className="screen has-nav">
      <StepHeader title="Compare" />

      <section className="compare-hero" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Compare policies &amp; quotes</h2>
        <p>
          Pick up to {MAX_SELECT} plans or saved quotes and see premiums, cover and
          key details side by side.
        </p>
      </section>

      <div className="compare-tabs" role="tablist" aria-label="Compare type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "plans"}
          className={`compare-tab${mode === "plans" ? " active" : ""}`}
          onClick={() => setMode("plans")}
        >
          Policies
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "quotes"}
          className={`compare-tab${mode === "quotes" ? " active" : ""}`}
          onClick={() => setMode("quotes")}
        >
          Quotes
        </button>
      </div>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="muted">Loading…</p> : null}

      {mode === "plans" ? (
        <>
          <div className="chips" role="tablist" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                className={`chip${category === item ? " active" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <p className="compare-hint muted">
            Selected {selectedPlans.length}/{MAX_SELECT}
          </p>

          <ul className="compare-pick-list">
            {filteredPlans.map((product) => {
              const checked = selectedPlans.includes(product.id);
              const disabled = !checked && selectedPlans.length >= MAX_SELECT;
              return (
                <li key={product.id}>
                  <label
                    className={`compare-pick${checked ? " selected" : ""}${
                      disabled ? " disabled" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onSelectPlan(product.id)}
                    />
                    <span className="compare-pick-body">
                      <strong>{product.title}</strong>
                      <span className="muted">
                        {product.category} · from{" "}
                        {formatMoney(product.price_from, product.currency)} /{" "}
                        {product.price_unit}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {selectedPlanItems.length >= 2 ? (
            <div className="compare-table-wrap" role="region" aria-label="Plan comparison">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col">Detail</th>
                    {selectedPlanItems.map((p) => (
                      <th scope="col" key={p.id}>
                        {p.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Category</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>{p.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">From</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>
                        <strong>
                          {formatMoney(p.price_from, p.currency)}
                        </strong>{" "}
                        <span className="muted">/ {p.price_unit}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Rating</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>
                        {p.rating.toFixed(1)} ({p.review_count})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Best seller</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>{p.best_seller ? "Yes" : "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Highlights</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>
                        {(p.bullets ?? []).length > 0 ? (
                          <ul className="compare-bullets">
                            {(p.bullets ?? []).slice(0, 4).map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          p.tagline || p.description
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Action</th>
                    {selectedPlanItems.map((p) => (
                      <td key={p.id}>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => navigate(`/quote/${p.id}`)}
                        >
                          Get quote
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted compare-empty">
              Select at least two policies to compare.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="compare-hint muted">
            Selected {selectedQuotes.length}/{MAX_SELECT}. Quotes are saved when you
            get an estimate.
          </p>

          {quotes.length === 0 ? (
            <div className="compare-empty-card">
              <p className="muted" style={{ margin: 0 }}>
                No saved quotes yet. Get a quote from the marketplace, then come back
                to compare.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate("/marketplace")}
              >
                Browse products
              </button>
            </div>
          ) : (
            <ul className="compare-pick-list">
              {quotes.map((quote) => {
                const checked = selectedQuotes.includes(quote.quote_id);
                const disabled = !checked && selectedQuotes.length >= MAX_SELECT;
                return (
                  <li key={quote.quote_id}>
                    <label
                      className={`compare-pick${checked ? " selected" : ""}${
                        disabled ? " disabled" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onSelectQuote(quote.quote_id)}
                      />
                      <span className="compare-pick-body">
                        <strong>{quote.product_title}</strong>
                        <span className="muted">
                          {quote.category} ·{" "}
                          {formatMoney(quote.estimated_premium, quote.currency)} /{" "}
                          {quote.price_unit}
                        </span>
                        <span className="muted compare-id">{quote.quote_id}</span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="compare-remove"
                      aria-label={`Remove ${quote.product_title} from compare`}
                      onClick={() => onRemoveQuote(quote.quote_id)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedQuoteItems.length >= 2 ? (
            <div className="compare-table-wrap" role="region" aria-label="Quote comparison">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col">Detail</th>
                    {selectedQuoteItems.map((q) => (
                      <th scope="col" key={q.quote_id}>
                        {q.product_title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Quote ID</th>
                    {selectedQuoteItems.map((q) => (
                      <td key={q.quote_id}>{q.quote_id}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Category</th>
                    {selectedQuoteItems.map((q) => (
                      <td key={q.quote_id}>{q.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Premium</th>
                    {selectedQuoteItems.map((q) => (
                      <td key={q.quote_id}>
                        <strong>
                          {formatMoney(q.estimated_premium, q.currency)}
                        </strong>{" "}
                        <span className="muted">/ {q.price_unit}</span>
                      </td>
                    ))}
                  </tr>
                  {quoteAnswerKeys.map((key) => (
                    <tr key={key}>
                      <th scope="row">{answerLabel(key)}</th>
                      {selectedQuoteItems.map((q) => (
                        <td key={q.quote_id}>
                          {q.answers?.[key] != null
                            ? String(q.answers[key])
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Action</th>
                    {selectedQuoteItems.map((q) => (
                      <td key={q.quote_id}>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => navigate(`/quote/${q.product_id}`)}
                        >
                          Revisit quote
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : quotes.length > 0 ? (
            <p className="muted compare-empty">
              Select at least two quotes to compare.
            </p>
          ) : null}
        </>
      )}

      <AssistantBar screen="marketplace" />
      <BottomNav active="policies" />
    </div>
  );
}
