import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { api, type ChatbotPolicyCard } from "../api";
import { IconChat } from "../icons";
import { useSession } from "../session";
import { useChatbot } from "./ChatbotContext";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: { title?: string; source?: string; category?: string }[];
  policies?: ChatbotPolicyCard[];
  action?: string | null;
  requiresLogin?: boolean;
};

const SESSION_KEY = "gcul_stallion_session";

const SUGGESTIONS = [
  "What home insurance do you offer?",
  "Give me my policy details",
  "Show me claims settled on the policy",
  "Summarize home insurance business rules",
];

const CHATBOT_DOWN_HINT =
  "Start chatbot-assistance-service on port 8090 (or run: local-dev.cmd apis).";

function formatChatbotError(err: unknown): string {
  if (!(err instanceof Error)) {
    return `Stallion is unavailable. ${CHATBOT_DOWN_HINT}`;
  }
  const msg = err.message;
  if (
    msg.includes("8090") ||
    msg.includes("chatbot-assistance") ||
    msg.includes("Stallion is unavailable")
  ) {
    return msg;
  }
  if (
    msg.includes("Invalid API response") ||
    msg.includes("Empty response") ||
    msg.includes("Service unavailable") ||
    msg.includes("Failed to fetch")
  ) {
    return `${msg} ${CHATBOT_DOWN_HINT}`;
  }
  return msg;
}

function formatAnswer(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
        {i < text.split("\n").length - 1 ? <br /> : null}
      </span>
    );
  });
}

export function ChatbotWidget({ autoOpen = false }: { autoOpen?: boolean }) {
  const { open, setOpen, openChat, seedQuestion, clearSeed } = useChatbot();
  const { token } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(
    localStorage.getItem(SESSION_KEY) ?? `stallion-${Date.now()}`,
  );
  if (!localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, sessionId.current);
  }
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi — I'm Stallion, your assistant. Ask about products, claims, or your policies when you're logged in.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const openedOnce = useRef(false);

  useEffect(() => {
    if (!autoOpen || openedOnce.current) return;
    const key = "gcul_chatbot_welcomed";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    openedOnce.current = true;
    openChat();
  }, [autoOpen, openChat]);

  useEffect(() => {
    if (!seedQuestion) return;
    void send(seedQuestion);
    clearSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuestion]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  async function send(raw: string, policyId?: string) {
    const text = raw.trim();
    if (!text && !policyId) return;
    if (loading) return;

    const display = text || "Show claims for selected policy";
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: display,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chatbotAsk(text || "claims settled on my policy", {
        sessionId: sessionId.current,
        policyId,
        token,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: res.answer,
          sources: res.sources,
          policies: res.policies,
          action: res.action,
          requiresLogin: res.requires_login,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: formatChatbotError(err),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`chatbot-fab${open ? " open" : ""}`}
        aria-label={open ? "Close Stallion assistant" : "Open Stallion assistant"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <IconChat size={22} />
      </button>

      {open ? (
        <section
          className="chatbot-panel"
          role="dialog"
          aria-label="Stallion assistant"
        >
          <header className="chatbot-header">
            <div>
              <strong>Stallion</strong>
              <span>Your assistant · Products · Claims · Your cover</span>
            </div>
            <button
              type="button"
              className="chatbot-close"
              aria-label="Close Stallion"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chatbot-suggestions" aria-label="Suggested questions">
            {SUGGESTIONS.map((q) => (
              <button key={q} type="button" onClick={() => void send(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-bubble ${msg.role}`}>
                <p>{formatAnswer(msg.text)}</p>
                {msg.requiresLogin ? (
                  <div className="chatbot-login-prompt">
                    <Link to="/login" className="chatbot-login-link">Log in</Link>
                    <Link to="/register" className="chatbot-login-link">Create account</Link>
                  </div>
                ) : null}
                {msg.policies && msg.policies.length > 0 ? (
                  <div className="chatbot-policy-cards" aria-label="Your policies">
                    {msg.policies.map((policy) => (
                      <button
                        key={policy.policy_id ?? policy.policy_number}
                        type="button"
                        className="chatbot-policy-card"
                        onClick={() => void send("", policy.policy_id)}
                      >
                        <strong>{policy.product_title ?? "Policy"}</strong>
                        <span>{policy.policy_number ?? policy.policy_id}</span>
                        <span className="muted">
                          {policy.status ?? "—"}
                          {policy.issued_at ? ` · ${policy.issued_at.slice(0, 10)}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {msg.sources && msg.sources.length > 0 ? (
                  <ul className="chatbot-sources">
                    {msg.sources.map((s, i) => (
                      <li key={`${msg.id}-s-${i}`}>
                        {s.title || s.source}
                        {s.category ? ` · ${s.category}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="chatbot-bubble assistant">
                <p>Stallion is thinking…</p>
              </div>
            ) : null}
          </div>

          <form className="chatbot-composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chatbot-input">
              Ask Stallion
            </label>
            <textarea
              id="chatbot-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Stallion about cover, claims, or your policies…"
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
