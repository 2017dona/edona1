import AppShell from '@/components/AppShell';
import CustomerDashboard from '@/components/customers/CustomerDashboard';

export default function HomePage() {
  return (
    <AppShell>
      <CustomerDashboard />
    </AppShell>
  );
}
