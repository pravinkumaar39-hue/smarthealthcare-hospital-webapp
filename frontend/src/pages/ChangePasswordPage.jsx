import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";

import Logo from "../components/Logo";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { changePassword } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser, homeRouteForRole } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, watch, formState: { errors },
  } = useForm();

  const newPassword = watch("new_password");

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      await changePassword(data.old_password, data.new_password);
      updateUser({ must_change_password: false });
      navigate(homeRouteForRole(user?.role || "PATIENT"), { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 mb-6 text-center"
      >
        <div className="mb-2 flex justify-center">
          <Logo size="lg" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card z-10 w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
            <ShieldCheck size={22} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Set a New Password</h2>
            <p className="text-xs text-gray-500">
              For your security, please change your default password.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Current Password (your Patient ID)"
            icon={Lock}
            type="password"
            placeholder="e.g. PTN0001"
            autoComplete="current-password"
            error={errors.old_password?.message}
            {...register("old_password", { required: "Current password is required" })}
          />
          <FormInput
            label="New Password"
            icon={Lock}
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            error={errors.new_password?.message}
            {...register("new_password", {
              required: "New password is required",
              minLength: { value: 6, message: "Must be at least 6 characters" },
            })}
          />
          <FormInput
            label="Confirm New Password"
            icon={Lock}
            type="password"
            placeholder="Re-enter new password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register("confirm_password", {
              required: "Please confirm your new password",
              validate: (value) => value === newPassword || "Passwords do not match",
            })}
          />

          <Button type="submit" loading={loading}>
            Update Password <ArrowRight size={16} />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
