export type RegisterDemoFields = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export function buildRegisterDemoFields(email?: string): RegisterDemoFields {
  const stamp = Date.now();
  return {
    fullName: 'Demo Customer',
    email: email?.trim() || `demo-customer-${stamp}@reboot2026.local`,
    mobile: '+447700900123',
    password: 'ChangeMe123!',
    confirmPassword: 'ChangeMe123!',
    terms: true,
  };
}
