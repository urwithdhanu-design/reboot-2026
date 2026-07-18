import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatbotContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openChat: (seed?: string) => void;
  seedQuestion: string | null;
  clearSeed: () => void;
};

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seedQuestion, setSeedQuestion] = useState<string | null>(null);

  const openChat = useCallback((seed?: string) => {
    if (seed) setSeedQuestion(seed);
    setOpen(true);
  }, []);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const clearSeed = useCallback(() => setSeedQuestion(null), []);

  const value = useMemo(
    () => ({ open, setOpen, toggle, openChat, seedQuestion, clearSeed }),
    [open, toggle, openChat, seedQuestion, clearSeed],
  );

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
}

export function useChatbotOptional() {
  return useContext(ChatbotContext);
}
