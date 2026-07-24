import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { KYCReviewPage } from './pages/KYCReviewPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { PlatformServicesPage } from './pages/PlatformServicesPage';
import { WalletOpsPage } from './pages/WalletOpsPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TokenizationPage } from './pages/TokenizationPage';
import { ChainObservabilityPage } from './pages/ChainObservabilityPage';
import { BlockchainLedgerPage } from './pages/BlockchainLedgerPage';
import { SmartContractsPage } from './pages/SmartContractsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VendorsPage } from './pages/VendorsPage';
import { VendorLoginPage, VendorPortalPage } from './pages/VendorPortalPages';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/vendor/login" element={<VendorLoginPage />} />
          <Route path="/vendor/portal" element={<VendorPortalPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYCReviewPage /></ProtectedRoute>} />
          <Route path="/policies" element={<ProtectedRoute><PoliciesPage /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><ClaimsPage /></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><WorkflowsPage /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><PlatformServicesPage /></ProtectedRoute>} />
          <Route path="/tokenization" element={<ProtectedRoute><TokenizationPage /></ProtectedRoute>} />
          <Route path="/observability" element={<ProtectedRoute><ChainObservabilityPage /></ProtectedRoute>} />
          <Route path="/blockchain" element={<ProtectedRoute><BlockchainLedgerPage /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><SmartContractsPage /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletOpsPage /></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
