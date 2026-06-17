import { useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Hospital,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import Logo from "../components/Logo";
import FormInput from "../components/FormInput";
import { loginAdmin } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginCardRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, homeRouteForRole } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const scrollToAdminLogin = () => {
    loginCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      document.getElementById("admin-id-input")?.focus();
    }, 450);
  };

  const redirectAfterLogin = (userInfo) => {
    const from = location.state?.from?.pathname;
    navigate(from || homeRouteForRole(userInfo.role), { replace: true });
  };

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);

    try {
      const res = await loginAdmin(
        data.username.trim().toUpperCase(),
        data.password
      );

      redirectAfterLogin(login(res.data));
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid Admin ID or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#042f2e] px-4 py-5 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="SmartHealthcare Hospital"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#03213f]/98 via-[#064e3b]/92 to-[#0f766e]/88" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(37,99,235,0.34),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.30),transparent_28%),radial-gradient(circle_at_50%_95%,rgba(245,158,11,0.16),transparent_34%)]" />

      <div className="relative z-10 mx-auto min-h-[calc(100vh-40px)] max-w-[1540px] rounded-[2rem] border border-white/15 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur-[2px]">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="rounded-3xl bg-white/95 px-5 py-3 shadow-xl ring-1 ring-white/60">
            <Logo size="sm" compact />
          </div>

          <a
            href="tel:9841012345"
            className="hidden items-center gap-3 rounded-3xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg backdrop-blur-xl transition hover:bg-white/20 sm:flex"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-white">
              <Phone size={19} />
            </span>
            <span>
              <span className="block text-xs text-white/70">Admin Helpdesk</span>
              +91 98410 12345
            </span>
          </a>
        </header>

        <main className="grid min-h-[760px] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.08] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
              <img
                src="/hospitals/chennai_hospital.png"
                alt="SmartHealthcare Hospital Admin"
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#03213f] via-[#03213f]/55 to-transparent" />
            </div>

            <div className="pointer-events-none absolute left-[50%] top-[14%] hidden h-28 w-28 rounded-[2rem] border border-white/10 bg-white/5 lg:block" />
            <div className="pointer-events-none absolute left-[43%] top-[8%] hidden h-2 w-32 rounded-full bg-white/20 lg:block" />

            <div className="relative max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-emerald-200">
                SmartHealthcare Staff Portal
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Welcome, <br />
                <span className="text-blue-300">Healthcare</span>
                <br />
                <span className="text-emerald-300">Leaders</span>
              </h1>

              <div className="mt-6 h-1.5 w-24 rounded-full bg-emerald-300" />

              <p className="mt-6 text-xl font-black text-white">
                Lead with clarity. Serve with care. Manage with confidence.
              </p>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/80">
                Access branch reports, monitor appointments, track doctors, and manage
                SmartHealthcare operations across Tamil Nadu with a secure admin dashboard.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                <AdminFeature icon={ShieldCheck} title="Secure Access" text="Role-based login" tone="blue" />
                <AdminFeature icon={Building2} title="Branch Control" text="City-wise reports" tone="green" />
                <AdminFeature icon={Users} title="City Admins" text="Live monitoring" tone="amber" />
                <AdminFeature icon={BarChart3} title="Reports" text="Admin insights" tone="purple" />
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-950/30">
                    <Sparkles size={28} />
                  </div>

                  <div>
                    <p className="text-base font-black text-white">
                      Admin Command Center
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/75">
                      Login to continue hospital monitoring and operational management.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToAdminLogin}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
                  >
                    Continue to Login
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-center sm:grid-cols-4">
                <AdminStat value="10" label="Branches" />
                <AdminStat value="50+" label="Doctors" />
                <AdminStat value="1000+" label="Patients" />
                <AdminStat value="24/7" label="Monitoring" />
              </div>
            </div>
          </section>

          <section ref={loginCardRef} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[2.3rem] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8"
            >
              <div className="mb-7 rounded-3xl border border-white/15 bg-white/10 px-5 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-950/30">
                    <Hospital size={28} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white">
                      Admin / Staff Login
                    </h2>
                    <p className="mt-1 text-sm font-medium text-emerald-100">
                      Super Admin and City Admin access
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 [&_label]:text-white/90 [&_input]:border-white/15 [&_input]:bg-white/95">
                <FormInput
                  id="admin-id-input"
                  label="Admin ID"
                  icon={ShieldCheck}
                  placeholder="Enter Admin ID"
                  autoComplete="username"
                  error={errors.username?.message}
                  {...register("username", { required: "Admin ID is required" })}
                />

                <FormInput
                  label="Password"
                  icon={Lock}
                  type="password"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register("password", { required: "Password is required" })}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-4 text-base font-black text-white shadow-lg shadow-emerald-950/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Login to Staff Portal"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 text-emerald-200" />
                  <div>
                    <p className="font-black text-white">Access Levels</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      Super Admin · City Admin · Hospital Reports · Dashboard Access
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 px-4 py-3 text-sm font-black text-white/85 transition hover:bg-white/10"
              >
                <ArrowLeft size={16} />
                Back to Patient Login
              </Link>
            </motion.div>

            <div className="rounded-[1.8rem] border border-emerald-200/20 bg-emerald-400/10 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-emerald-200 shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-base font-black text-white">
                    Operational Excellence Starts Here
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/75">
                    Every decision you make helps patients receive faster, safer, and better care.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <p className="relative z-10 mt-5 text-center text-xs font-medium text-white/55">
          © {new Date().getFullYear()} SmartHealthcare Hospital · Authorized Access Only
        </p>
      </div>
    </div>
  );
}

function AdminFeature({ icon: Icon, title, text, tone }) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-100",
    green: "bg-emerald-500/15 text-emerald-100",
    amber: "bg-amber-500/15 text-amber-100",
    purple: "bg-purple-500/15 text-purple-100",
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-center shadow-sm backdrop-blur">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon size={25} />
      </div>
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-white/65">{text}</p>
    </div>
  );
}

function AdminStat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
      <p className="text-lg font-black text-emerald-200">{value}</p>
      <p className="text-xs font-semibold text-white/65">{label}</p>
    </div>
  );
}
