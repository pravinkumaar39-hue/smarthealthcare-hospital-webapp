import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Hospital,
  ArrowLeft,
} from "lucide-react";

import FormInput from "../components/FormInput";
import { loginAdmin } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, homeRouteForRole } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-700 shadow-xl shadow-emerald-200">
            <ShieldCheck size={42} className="text-white" strokeWidth={2.3} />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-900 sm:text-5xl">
            SmartCare Staff Portal
          </h1>

          <p className="mt-3 text-sm font-bold uppercase tracking-[0.35em] text-slate-500">
            Admin Login
          </p>

          <p className="mt-4 text-base font-medium text-emerald-700">
            Secure access for authorized hospital staff only
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-2xl shadow-emerald-100 backdrop-blur-xl sm:p-9"
        >
          <div className="mb-7 rounded-3xl bg-emerald-50 px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                <Hospital size={28} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  Admin / Staff Login
                </h2>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Super Admin and City Admin access
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login to Staff Portal"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-emerald-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 text-emerald-700" />
              <div>
                <p className="font-bold text-emerald-800">Access Levels</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Super Admin · City Admin · Hospital Reports · Dashboard Access
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
          >
            <ArrowLeft size={16} />
            Back to Patient Login
          </Link>
        </motion.div>

        <p className="mt-6 text-center text-xs text-emerald-800/60">
          © {new Date().getFullYear()} SmartCare AI Hospital · Authorized Access Only
        </p>
      </div>
    </div>
  );
}