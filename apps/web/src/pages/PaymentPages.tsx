import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { BottomNav, StepHeader } from "../components";
import { clearStashedQuote, readStashedQuote } from "../components/PayQuoteButton";

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id") ?? "";
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!sessionId) {
      setError("Missing Stripe session id");
      setLoading(false);
      return;
    }
    api
      .getPaymentSession(sessionId)
      .then((res) => {
        if (!alive) return;
        setPaid(res.paid);
        setAmount(res.amount_total);
        setQuoteId(res.quote_id);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not verify payment");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const quote = readStashedQuote();

  function goToPolicies() {
    const saved = quote;
    clearStashedQuote();
    navigate("/policies", {
      state: {
        quote: saved,
        payment: { paid: true, session_id: sessionId, quote_id: quoteId },
      },
    });
  }

  return (
    <div className="screen has-nav">
      <StepHeader title="Payment" />
      <h2 className="section-title">
        {loading ? "Confirming payment…" : paid ? "Payment successful" : "Payment status"}
      </h2>

      {loading ? <p className="muted">Checking with Stripe…</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && paid ? (
        <div className="quote-card">
          <span className="muted">Paid</span>
          <strong>
            {amount != null ? `£${amount.toFixed(2)}` : "Premium received"}
          </strong>
          <p className="muted" style={{ margin: 0 }}>
            {quote?.product_title ?? "Insurance premium"}
            {quoteId ? ` · ${quoteId}` : ""}
          </p>
        </div>
      ) : null}

      {!loading && !paid && !error ? (
        <p className="muted">Payment is not complete yet. You can try again from your quote.</p>
      ) : null}

      {paid ? (
        <button className="btn-primary" type="button" onClick={goToPolicies}>
          Continue to policies
        </button>
      ) : (
        <Link to="/marketplace" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
          Back to marketplace
        </Link>
      )}
      <BottomNav active="policies" />
    </div>
  );
}

export function PaymentCancelPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const quoteId = params.get("quote_id");
  const quote = readStashedQuote();

  return (
    <div className="screen has-nav">
      <StepHeader title="Payment" />
      <h2 className="section-title">Payment cancelled</h2>
      <p className="muted">
        No charge was made
        {quoteId ? ` for quote ${quoteId}` : ""}. You can pay later from your quote.
      </p>
      {quote ? (
        <button
          className="btn-primary"
          type="button"
          onClick={() => navigate(`/quote/${quote.product_id}`)}
        >
          Return to quote
        </button>
      ) : (
        <Link to="/marketplace" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
          Back to marketplace
        </Link>
      )}
      <BottomNav active="home" />
    </div>
  );
}
