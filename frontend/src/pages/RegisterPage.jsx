import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  User, Phone, Mail, MapPin, Droplet, Calendar, Users, ArrowLeft,
  CheckCircle2, Copy,
} from "lucide-react";

import Logo from "../components/Logo";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { registerPatient } from "../api/client";

const STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Punjab",
];

const TN_CITIES = [
  "Chennai", "Trichy", "Madurai", "Coimbatore", "Thanjavur",
  "Salem", "Tirunelveli", "Erode", "Vellore", "Hosur",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // { patient_id, name }

  const {
    register, handleSubmit, watch, formState: { errors },
  } = useForm({
    defaultValues: { state: "Tamil Nadu", city: "Chennai", gender: "Male" },
  });

  const selectedState = watch("state");

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...data,
        age: Number(data.age),
        email: data.email || undefined,
      };
      const res = await registerPatient(payload);
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <RegistrationSuccess patient={success} onContinue={() => navigate("/login")} />;
  }

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
        <p className="font-medium text-primary-700/80">New Patient Registration</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card z-10 w-full max-w-2xl rounded-3xl p-6 sm:p-8"
      >
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              icon={User}
              placeholder="e.g. Murugan Mani"
              error={errors.name?.message}
              {...register("name", { required: "Full name is required", minLength: { value: 2, message: "Too short" } })}
            />
            <FormInput
              label="Age"
              icon={Calendar}
              type="number"
              placeholder="e.g. 32"
              min={0}
              max={120}
              error={errors.age?.message}
              {...register("age", {
                required: "Age is required",
                min: { value: 0, message: "Invalid age" },
                max: { value: 120, message: "Invalid age" },
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender</label>
              <div className="relative">
                <Users size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 pl-10 text-sm text-gray-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  {...register("gender", { required: true })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Blood Group</label>
              <div className="relative">
                <Droplet size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 pl-10 text-sm text-gray-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  {...register("blood_group", { required: "Blood group is required" })}
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              {errors.blood_group && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.blood_group.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Mobile Number"
              icon={Phone}
              placeholder="98765 43210"
              maxLength={10}
              error={errors.phone?.message}
              {...register("phone", {
                required: "Mobile number is required",
                pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit mobile number" },
              })}
            />
            <FormInput
              label="Email (optional)"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
              })}
            />
          </div>

          <FormInput
            label="Address"
            icon={MapPin}
            placeholder="House No, Street, Area"
            {...register("address")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm text-gray-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                {...register("state", { required: true })}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
              {selectedState === "Tamil Nadu" ? (
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm text-gray-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  {...register("city", { required: true })}
                >
                  {TN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <FormInput
                  placeholder="Enter your city"
                  error={errors.city?.message}
                  {...register("city", { required: "City is required" })}
                />
              )}
            </div>
          </div>

          {selectedState === "Tamil Nadu" && (
            <p className="text-xs text-gray-500">
              You'll be assigned to the SmartHealthcare branch in your selected city.
            </p>
          )}
          {selectedState !== "Tamil Nadu" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Note: SmartHealthcare hospital branches currently operate only within Tamil
              Nadu (Chennai, Trichy, Madurai, Coimbatore, Thanjavur, Salem, Tirunelveli,
              Erode, Vellore, Hosur). Registration for other states may not be assignable
              to a branch.
            </p>
          )}

          <Button type="submit" loading={loading}>
            Create Account
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// =========================================================
// SUCCESS SCREEN — shows generated Patient ID
// =========================================================
function RegistrationSuccess({ patient, onContinue }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(patient.patient_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card z-10 w-full max-w-md rounded-3xl p-8 text-center"
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Registration Successful!</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to SmartHealthcare, {patient.name}.
        </p>

        <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-500">
            Your Patient ID
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold tracking-wider text-primary-800">
              {patient.patient_id}
            </span>
            <button
              onClick={copyId}
              className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-100"
              title="Copy Patient ID"
            >
              <Copy size={16} />
            </button>
          </div>
          {copied && <p className="mt-1 text-xs text-green-600">Copied!</p>}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Your default password is the same as your Patient ID
          (<strong>{patient.patient_id}</strong>). You'll be asked to change it
          after your first login.
        </p>

        <Button className="mt-6" onClick={onContinue}>
          Continue to Login
        </Button>
      </motion.div>
    </div>
  );
}
