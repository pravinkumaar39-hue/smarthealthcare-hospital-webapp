import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

/**
 * Generic placeholder dashboard shell, shared across roles until
 * Module 4+ (Patient Portal / Admin Dashboards) are built.
 */
function DashboardShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="flex items-center justify-between border-b border-primary-100 bg-white px-6 py-4 shadow-sm">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.name || user?.user_id}</p>
            <p className="text-xs text-gray-500">{user?.role?.replace("_", " ")}</p>
          </div>
          <Button variant="outline" className="w-auto px-3 py-2" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="mt-1 text-gray-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title={`Good to see you, ${user?.name || "Patient"} 👋`}
      subtitle="This is your SmartHealthcare patient portal."
    >
      <PlaceholderCard text="Patient Dashboard (Module 4): Upcoming Appointment, Token Number, Health Summary, AI Assistant, etc. will be built here." />
    </DashboardShell>
  );
}

export function CityAdminDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title={`Welcome, ${user?.user_id} (City Admin)`}
      subtitle={`Managing data for ${user?.city || "your city"}.`}
    >
      <PlaceholderCard text="City Admin Dashboard (Module 8): patients, doctors, appointments, and analytics scoped to your city." />
    </DashboardShell>
  );
}

export function StateAdminDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title={`Tamil Nadu Healthcare Command Center`}
      subtitle={`Welcome, ${user?.user_id} (State Admin)`}
    >
      <PlaceholderCard text="State Admin Dashboard (Module 9): state-wide KPIs, charts, and reports across all 10 branches." />
    </DashboardShell>
  );
}

export function SuperAdminDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title="Super Admin Console"
      subtitle={`Welcome, ${user?.user_id}. Full system access.`}
    >
      <PlaceholderCard text="Super Admin Dashboard (Module 10): manage all patients, doctors, branches, admins, and system-wide analytics." />
    </DashboardShell>
  );
}

function PlaceholderCard({ text }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-white/60 p-8 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
