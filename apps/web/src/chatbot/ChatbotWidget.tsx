import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api } from "../api";
import { IconChat } from "../icons";
import { useChatbot } from "./ChatbotContext";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: { title?: string; source?: string; category?: string }[];
};

const SUGGESTIONS = [
  "What home insurance do you offer?",
  "How do I make a claim?",
  "What types of insurance are available?",
  "Tell me about pet insurance",
];

export function ChatbotWidget({ autoOpen = false }: { autoOpen?: boolean }) {
  const { open, setOpen, openChat, seedQuestion, clearSeed } = useChatbot();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi — I'm your insurance assistant. Ask about products, claims, or types of cover.",
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

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chatbotAsk(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: res.answer,
          sources: res.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text:
            err instanceof Error
              ? `${err.message} Start chatbot-assistance-service on port 8090.`
              : "Chatbot unavailable. Start the Python service on port 8090.",
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
        aria-label={open ? "Close insurance chatbot" : "Open insurance chatbot"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <IconChat size={22} />
      </button>

      {open ? (
        <section
          className="chatbot-panel"
          role="dialog"
          aria-label="Insurance chatbot assistant"
        >
          <header className="chatbot-header">
            <div>
              <strong>Insurance assistant</strong>
              <span>Products · Claims · Cover types</span>
            </div>
            <button
              type="button"
              className="chatbot-close"
              aria-label="Close chatbot"
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
                <p>{msg.text}</p>
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
                <p>Searching knowledge…</p>
              </div>
            ) : null}
          </div>

          <form className="chatbot-composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chatbot-input">
              Ask a question
            </label>
            <textarea
              id="chatbot-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about cover, claims, products…"
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
