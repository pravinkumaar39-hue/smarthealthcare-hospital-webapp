import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Droplet,
  HeartPulse,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import Logo from "../components/Logo";
import { registerPatient } from "../api/client";

const STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi",
  "Gujarat",
  "West Bengal",
  "Punjab",
];

const TN_CITIES = [
  "Chennai",
  "Trichy",
  "Madurai",
  "Coimbatore",
  "Thanjavur",
  "Salem",
  "Tirunelveli",
  "Erode",
  "Vellore",
  "Hosur",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      state: "Tamil Nadu",
      city: "Chennai",
      gender: "Male",
      blood_group: "",
    },
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
      setError(
        err.response?.data?.detail ||
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <RegistrationSuccess
        patient={success}
        onContinue={() => navigate("/login")}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041b3d] px-4 py-5 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="SmartHealthcare Hospital"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#041b3d]/98 via-[#063b7a]/88 to-[#047857]/86" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(59,130,246,0.34),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.28),transparent_28%),radial-gradient(circle_at_50%_95%,rgba(6,182,212,0.18),transparent_34%)]" />

      <div className="relative z-10 mx-auto min-h-[calc(100vh-40px)] max-w-[1540px] rounded-[2rem] border border-white/15 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur-[2px]">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="rounded-3xl bg-white/95 px-5 py-3 shadow-xl ring-1 ring-white/60">
            <Logo size="sm" compact />
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg backdrop-blur-xl transition hover:bg-white/20"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </header>

        <main className="grid min-h-[760px] items-center gap-8 lg:grid-cols-[1.02fr_1fr]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.08] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
              <img
                src="/hospitals/chennai_hospital.png"
                alt="SmartHealthcare Hospital Registration"
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041b3d] via-[#041b3d]/55 to-transparent" />
            </div>

            <div className="relative max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-200">
                Smart Care. Better Health. Better Life.
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Create Your <br />
                <span className="text-blue-300">SmartHealthcare</span>
                <br />
                Account
              </h1>

              <div className="mt-6 h-1.5 w-24 rounded-full bg-emerald-300" />

              <div className="mt-6 flex gap-4 rounded-[1.8rem] border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-xl">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-emerald-200">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-xl font-black text-white">
                    Your safe care journey starts here.
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/78">
                    Register once and enjoy smoother appointments, secure medical
                    access, trusted doctors, and a stress-free hospital experience.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                <RegisterFeature
                  icon={ShieldCheck}
                  title="Secure Registration"
                  text="Your data is encrypted and protected."
                  tone="blue"
                />
                <RegisterFeature
                  icon={CalendarCheck}
                  title="Smooth Appointments"
                  text="Book, manage, and track visits easily."
                  tone="green"
                />
                <RegisterFeature
                  icon={Stethoscope}
                  title="Trusted Doctors"
                  text="Access experienced and verified doctors."
                  tone="purple"
                />
                <RegisterFeature
                  icon={LockKeyhole}
                  title="Safe Records"
                  text="Your records are private and accessible."
                  tone="red"
                />
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
                    <UserPlus size={28} />
                  </div>

                  <div>
                    <p className="text-base font-black text-white">New here?</p>
                    <p className="mt-1 text-sm font-medium text-white/75">
                      Create your account and get started with safe, seamless care.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("patient-register-form")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
                  >
                    Create Account
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-center sm:grid-cols-4">
                <RegisterStat value="1000+" label="Happy Patients" />
                <RegisterStat value="50+" label="Expert Doctors" />
                <RegisterStat value="10+" label="Specialities" />
                <RegisterStat value="10" label="TN Branches" />
              </div>
            </div>
          </section>

          <section id="patient-register-form" className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[2.3rem] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8"
            >
              <div className="mb-7">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">
                  New Patient Registration
                </p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  Create your patient account securely.
                </h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-emerald-300" />
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <GlassInput
                    label="Full Name"
                    icon={User}
                    placeholder="e.g. Murugan Mani"
                    error={errors.name?.message}
                    {...register("name", {
                      required: "Full name is required",
                      minLength: { value: 2, message: "Too short" },
                    })}
                  />

                  <GlassInput
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
                  <GlassSelect label="Gender" icon={Users} {...register("gender", { required: true })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </GlassSelect>

                  <GlassSelect
                    label="Blood Group"
                    icon={Droplet}
                    error={errors.blood_group?.message}
                    {...register("blood_group", {
                      required: "Blood group is required",
                    })}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </GlassSelect>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <GlassInput
                    label="Mobile Number"
                    icon={Phone}
                    placeholder="98765 43210"
                    maxLength={10}
                    error={errors.phone?.message}
                    {...register("phone", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: "Enter a valid 10-digit mobile number",
                      },
                    })}
                  />

                  <GlassInput
                    label="Email (optional)"
                    icon={Mail}
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email", {
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Enter a valid email",
                      },
                    })}
                  />
                </div>

                <GlassInput
                  label="Address"
                  icon={MapPin}
                  placeholder="House No, Street, Area"
                  {...register("address")}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <GlassSelect label="State" icon={Building2} {...register("state", { required: true })}>
                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </GlassSelect>

                  {selectedState === "Tamil Nadu" ? (
                    <GlassSelect label="City" icon={MapPin} {...register("city", { required: true })}>
                      {TN_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </GlassSelect>
                  ) : (
                    <GlassInput
                      label="City"
                      icon={MapPin}
                      placeholder="Enter your city"
                      error={errors.city?.message}
                      {...register("city", { required: "City is required" })}
                    />
                  )}
                </div>

                {selectedState === "Tamil Nadu" ? (
                  <p className="rounded-2xl border border-emerald-200/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-100">
                    Your account will be linked to the SmartHealthcare branch in your selected city for faster appointments.
                  </p>
                ) : (
                  <p className="rounded-2xl border border-amber-200/30 bg-amber-400/10 px-4 py-3 text-xs font-semibold text-amber-100">
                    SmartHealthcare branches currently operate only within Tamil Nadu. Other state registrations may not be assigned to a branch.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-950/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating account..." : "Create Account"}
                  {!loading && <ArrowRight size={20} />}
                </button>

                <p className="text-center text-sm text-white/75">
                  Already have an account?{" "}
                  <Link to="/login" className="font-black text-emerald-200 hover:underline">
                    Back to Login
                  </Link>
                </p>
              </form>
            </motion.div>

            <div className="rounded-[1.8rem] border border-emerald-200/20 bg-emerald-400/10 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-emerald-200 shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-base font-black text-white">
                    Your information is protected
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/75">
                    We follow privacy-first healthcare practices to keep your data secure.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <p className="relative z-10 mt-5 text-center text-xs font-medium text-white/55">
          © {new Date().getFullYear()} SmartHealthcare Hospital · Tamil Nadu
        </p>
      </div>
    </div>
  );
}

function GlassInput({ label, icon: Icon, error, className = "", ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-white/90">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
          />
        )}
        <input
          {...props}
          className={`w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 ${
            Icon ? "pl-12" : ""
          } text-sm font-semibold text-white placeholder:text-white/45 outline-none backdrop-blur transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-300/20 ${className}`}
        />
      </div>
      {error && <p className="mt-1 text-xs font-bold text-red-200">{error}</p>}
    </div>
  );
}

function GlassSelect({ label, icon: Icon, error, children, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-white/90">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
          />
        )}
        <select
          {...props}
          className={`w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 ${
            Icon ? "pl-12" : ""
          } text-sm font-semibold text-white outline-none backdrop-blur transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-300/20 [&_option]:bg-slate-900 [&_option]:text-white`}
        >
          {children}
        </select>
      </div>
      {error && <p className="mt-1 text-xs font-bold text-red-200">{error}</p>}
    </div>
  );
}

function RegisterFeature({ icon: Icon, title, text, tone }) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-100",
    green: "bg-emerald-500/15 text-emerald-100",
    purple: "bg-purple-500/15 text-purple-100",
    red: "bg-red-500/15 text-red-100",
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

function RegisterStat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
      <p className="text-lg font-black text-emerald-200">{value}</p>
      <p className="text-xs font-semibold text-white/65">{label}</p>
    </div>
  );
}

function RegistrationSuccess({ patient, onContinue }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(patient.patient_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041b3d] px-4 py-10 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="SmartHealthcare Hospital"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#041b3d]/98 via-[#063b7a]/88 to-[#047857]/86" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col items-center justify-center"
      >
        <div className="w-full rounded-[2.3rem] border border-white/20 bg-white/10 p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-2xl">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-200/30">
              <CheckCircle2 size={36} className="text-emerald-200" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white">
            Registration Successful!
          </h2>

          <p className="mt-2 text-sm font-medium text-white/70">
            Welcome to SmartHealthcare, {patient.name}.
          </p>

          <div className="mt-6 rounded-3xl border border-blue-200/20 bg-blue-500/15 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-blue-100">
              Your Patient ID
            </p>

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-3xl font-black tracking-wider text-white">
                {patient.patient_id}
              </span>
              <button
                onClick={copyId}
                className="rounded-xl p-2 text-blue-100 hover:bg-white/10"
                title="Copy Patient ID"
              >
                <Copy size={17} />
              </button>
            </div>

            {copied && <p className="mt-1 text-xs font-bold text-emerald-200">Copied!</p>}
          </div>

          <p className="mt-4 text-xs font-medium leading-6 text-white/70">
            Your default password is the same as your Patient ID
            (<strong>{patient.patient_id}</strong>). You will be asked to change it
            after your first login.
          </p>

          <button
            onClick={onContinue}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-4 text-base font-black text-white shadow-lg"
          >
            Continue to Login
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
