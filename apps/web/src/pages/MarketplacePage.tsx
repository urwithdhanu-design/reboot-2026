import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Product } from "../api";
import { loadMarketplaceFromFirestore } from "../firestore/catalogCache";
import { AssistantBar, BottomNav, StepHeader } from "../components";
import { IconSearch, productIcon } from "../icons";

const DEFAULT_CATEGORIES = [
  "All",
  "Health",
  "Vehicle",
  "Pet",
  "Property",
  "Life",
  "Travel",
];

export function MarketplacePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([
    "All",
    "Health",
    "Vehicle",
    "Pet",
    "Property",
    "Life",
    "Travel",
  ]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const cached = await loadMarketplaceFromFirestore();
      if (cached && alive) {
        const cat = category === "All" ? undefined : category;
        const q = (query || "").trim().toLowerCase();
        let list = cached.products;
        if (cat) {
          list = list.filter((p) => p.category.toLowerCase() === cat.toLowerCase());
        }
        if (q) {
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q),
          );
        }
        setCategories(cached.categories);
        setProducts(list);
        setError(null);
        return;
      }
      return api
        .listProducts(category === "All" ? undefined : category, query || undefined)
        .then((res) => {
          if (!alive) return;
          setCategories(res.categories ?? DEFAULT_CATEGORIES);
          setProducts(res.products ?? []);
          setError(null);
        });
    };

    load().catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : "Failed to load products");
        });

    return () => {
      alive = false;
    };
  }, [category, query]);

  const heading = useMemo(
    () => (category === "All" ? "Insurance products" : `${category} cover`),
    [category],
  );

  const openQuote = (productId: string) => navigate(`/quote/${productId}`);

  return (
    <div className="screen has-nav">
      <StepHeader title="Product Marketplace" />

      <div className="search-shell">
        <IconSearch />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search insurance products"
          aria-label="Search insurance products"
        />
      </div>

      <div className="chips" role="tablist" aria-label="Categories">
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

      <div className="muted" style={{ fontSize: "0.85rem" }}>
        {heading}
      </div>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <aside className="gaps-banner" aria-label="Protection gaps">
        <h3>Any gaps in your protection?</h3>
        <p>We have help for you within our app.</p>
        <ul>
          <li>Understand the cover you already have with us.</li>
          <li>Find out how to protect yourself and your loved ones.</li>
        </ul>
        <button
          type="button"
          className="gaps-compare-btn"
          onClick={() => navigate("/compare")}
        >
          Compare policies &amp; quotes
        </button>
      </aside>

      <div className="product-list promo-list">
        {products.map((product) => {
          const tagline = product.tagline || product.description;
          const bullets = product.bullets ?? [];
          const cta = product.cta_label || product.title;
          return (
            <article className="promo-card" key={product.id}>
              <div className="promo-icon" aria-hidden>
                {productIcon(product.icon)}
              </div>
              <h3>{product.title}</h3>
              <p className="promo-tagline">{tagline}</p>
              {bullets.length > 0 ? (
                <ul className="promo-bullets">
                  {bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className="promo-cta"
                onClick={() => openQuote(product.id)}
              >
                {cta}
              </button>
            </article>
          );
        })}
      </div>

      <AssistantBar screen="marketplace" />
      <BottomNav active="home" />
    </div>
  );
}
