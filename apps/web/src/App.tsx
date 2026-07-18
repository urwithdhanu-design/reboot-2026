import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "./session";
import { ChatbotProvider } from "./chatbot/ChatbotContext";
import { ChatbotWidget } from "./chatbot/ChatbotWidget";
import { ViewModeProvider, useViewMode } from "./viewMode";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { ComparePage } from "./pages/ComparePage";
import { KycPage } from "./pages/KycPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { ClaimsPage, PoliciesPage, ProfilePage } from "./pages/NavPages";
import { PaymentCancelPage, PaymentSuccessPage } from "./pages/PaymentPages";
import { ProductMarketingPage } from "./pages/ProductMarketingPage";
import { QuoteBuilderPage } from "./pages/QuoteBuilderPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { WalletPage } from "./pages/WalletPage";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useSession();
  const location = useLocation();
  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

function AppShell() {
  const { viewMode, isDesktopView } = useViewMode();

  return (
    <div className={`app-shell view-${viewMode}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ViewModeToggle />
      <div
        className={`phone phone-marketing${isDesktopView ? " phone-desktop" : ""}`}
        id="main-content"
        tabIndex={-1}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products/:slug" element={<ProductMarketingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/kyc"
            element={
              <RequireAuth>
                <KycPage />
              </RequireAuth>
            }
          />
          <Route
            path="/wallet"
            element={
              <RequireAuth>
                <WalletPage />
              </RequireAuth>
            }
          />
          <Route
            path="/marketplace"
            element={
              <RequireAuth>
                <MarketplacePage />
              </RequireAuth>
            }
          />
          <Route
            path="/quote/:productId"
            element={
              <RequireAuth>
                <QuoteBuilderPage />
              </RequireAuth>
            }
          />
          <Route
            path="/payment/success"
            element={
              <RequireAuth>
                <PaymentSuccessPage />
              </RequireAuth>
            }
          />
          <Route
            path="/payment/cancel"
            element={
              <RequireAuth>
                <PaymentCancelPage />
              </RequireAuth>
            }
          />
          <Route
            path="/compare"
            element={
              <RequireAuth>
                <ComparePage />
              </RequireAuth>
            }
          />
          <Route
            path="/policies"
            element={
              <RequireAuth>
                <PoliciesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/claims"
            element={
              <RequireAuth>
                <ClaimsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
        </Routes>
        <ChatbotWidget autoOpen />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ViewModeProvider>
        <ChatbotProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ChatbotProvider>
      </ViewModeProvider>
    </SessionProvider>
  );
}
