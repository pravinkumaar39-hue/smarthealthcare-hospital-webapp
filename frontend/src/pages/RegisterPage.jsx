import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Copy,
  Droplet,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import Logo from "../components/Logo";
import { registerPatient } from "../api/client";

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

const initialForm = {
  name: "",
  dob: "",
  age: "",
  gender: "Male",
  blood_group: "",
  phone: "",
  email: "",
  address: "",
  state: "Tamil Nadu",
  city: "Chennai",
};

function getBackendErrorMessage(err) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.join(".") : "field";
        return `${field}: ${item.msg}`;
      })
      .join(" | ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return "Registration failed. Please check your details and try again.";
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const calculateAgeFromDob = (dobValue) => {
    if (!dobValue) return "";

    const dob = new Date(dobValue);

    if (Number.isNaN(dob.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age > 0 && age <= 120 ? String(age) : "";
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      if (field === "dob") {
        return {
          ...prev,
          dob: value,
          age: calculateAgeFromDob(value),
        };
      }

      return { ...prev, [field]: value };
    });

    setErrors((prev) => ({ ...prev, [field]: "", age: "" }));
    setServerError("");
  };

  const validate = () => {
    const next = {};
    const cleanPhone = String(form.phone || "").replace(/\D/g, "");

    if (!form.name.trim()) next.name = "Enter full name";
    if (!form.dob) next.dob = "Select date of birth";
    if (!form.age || Number(form.age) < 1 || Number(form.age) > 120) {
      next.age = "Enter valid age";
    }
    if (!form.blood_group) next.blood_group = "Select blood group";
    if (cleanPhone.length !== 10) next.phone = "Enter 10-digit mobile number";
    if (!form.address.trim()) next.address = "Enter address";
    if (!form.city.trim()) next.city = "Select city";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const fullName = form.name.trim();
      const nameParts = fullName.split(" ").filter(Boolean);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(" ") || " ";

      const payload = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        age: Number(form.age),
        dob: form.dob,
        gender: form.gender,
        blood_group: form.blood_group,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        state: "Tamil Nadu",
        city: form.city.trim(),
      };

      const res = await registerPatient(payload);

      setSuccess({
        ...res.data,
        name: res.data?.name || payload.name,
        phone: payload.phone,
        city: payload.city,
      });
    } catch (err) {
      setServerError(getBackendErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <RegistrationSuccess patient={success} onContinue={() => navigate("/login")} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041b3d] px-4 py-5 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="SmartHealthcare Hospital"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#041b3d]/95 via-[#064b88]/85 to-[#047857]/85" />

      <div className="relative z-10 mx-auto max-w-[1500px] rounded-[2rem] border border-white/15 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="rounded-3xl bg-white/95 px-5 py-3 shadow-xl">
            <Logo size="sm" />
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white/20"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>

        <div className="grid min-h-[760px] items-center gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[2.5rem] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200">
              Smart Care. Better Health. Better Life.
            </p>

            <h1 className="mt-6 text-5xl font-black leading-tight sm:text-6xl">
              Create Your <br />
              <span className="text-blue-300">SmartHealthcare</span>
              <br />
              Account
            </h1>

            <div className="mt-6 h-1.5 w-24 rounded-full bg-emerald-300" />

            <div className="mt-6 rounded-[1.8rem] border border-white/15 bg-white/10 p-5">
              <div className="flex gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-emerald-200">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-xl font-black">Your safe care journey starts here.</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">
                    Register once and enjoy smoother appointments, secure medical access,
                    trusted doctors, and a stress-free hospital experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Feature icon={ShieldCheck} title="Secure Registration" text="Your data is protected." />
              <Feature icon={Calendar} title="Smooth Appointments" text="Book visits easily." />
              <Feature icon={Stethoscope} title="Trusted Doctors" text="Verified specialists." />
              <Feature icon={UserPlus} title="Patient First" text="Safe care journey." />
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">
              New Patient Registration
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Create your patient account securely.
            </h2>
            <div className="mt-4 h-1 w-16 rounded-full bg-emerald-300" />

            {serverError && (
              <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">
                {serverError}
              </div>
            )}

            <form onSubmit={submitForm} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  icon={User}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Priya Kanagaraj"
                  error={errors.name}
                />

                <Input
                  label="Date of Birth"
                  icon={Calendar}
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                  error={errors.dob || errors.age}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Gender"
                  icon={Users}
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>

                <Select
                  label="Blood Group"
                  icon={Droplet}
                  value={form.blood_group}
                  onChange={(e) => updateField("blood_group", e.target.value)}
                  error={errors.blood_group}
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Mobile Number"
                  icon={Phone}
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="98765 43210"
                  error={errors.phone}
                />

                <Input
                  label="Email (optional)"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <Input
                label="Address"
                icon={MapPin}
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="House No, Street, Area"
                error={errors.address}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="State"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                >
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </Select>

                <Select
                  label="City"
                  icon={MapPin}
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  error={errors.city}
                >
                  {TN_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </Select>
              </div>

              <p className="rounded-2xl border border-emerald-200/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-100">
                Your account will be linked to the SmartHealthcare branch in your selected city.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-4 text-base font-black text-white shadow-lg disabled:opacity-70"
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
          </section>
        </div>
      </div>
    </div>
  );
}

function Input({ label, icon: Icon, error, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-white">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
        )}
        <input
          {...props}
          className={`w-full rounded-2xl border border-white/25 bg-white/15 px-4 py-3.5 ${
            Icon ? "pl-12" : ""
          } text-sm font-bold text-white placeholder:text-white/45 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30`}
        />
      </div>
      {error && <p className="mt-1 text-xs font-black text-red-200">{error}</p>}
    </div>
  );
}

function Select({ label, icon: Icon, error, children, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-white">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
        )}
        <select
          {...props}
          className={`w-full rounded-2xl border border-white/25 bg-white/15 px-4 py-3.5 ${
            Icon ? "pl-12" : ""
          } text-sm font-bold text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30 [&_option]:bg-slate-900 [&_option]:text-white`}
        >
          {children}
        </select>
      </div>
      {error && <p className="mt-1 text-xs font-black text-red-200">{error}</p>}
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-emerald-200">
        <Icon size={24} />
      </div>
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-medium text-white/65">{text}</p>
    </div>
  );
}

function RegistrationSuccess({ patient, onContinue }) {
  const [copied, setCopied] = useState(false);

  const patientName = patient.name || "Patient";
  const patientId = patient.patient_id || "Generated";
  const branchName = `SmartHealthcare ${patient.city || "Nearest Branch"}`;

  const copyId = () => {
    navigator.clipboard.writeText(patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openWelcomeWhatsApp = () => {
    const rawPhone = String(patient.phone || "").replace(/\D/g, "");

    if (!rawPhone) {
      alert("Patient mobile number not found.");
      return;
    }

    const phone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;

    const messageLines = [
      `Hello ${patientName},`,
      "",
      "Welcome to SmartHealthcare Hospital.",
      "",
      "Congratulations! Your patient account has been created successfully.",
      "",
      `Patient ID: ${patientId}`,
      `Nearest Branch: ${branchName}`,
      "",
      "We are happy to have you with us. Your health, safety, and comfort matter to us. Our care team is here to support your healthcare journey.",
      "",
      "You can now book appointments with trusted doctors anytime.",
      "",
      "Smart Care. Better Health. Better Life.",
    ];

    const message = messageLines.join("\n");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#041b3d] px-4 py-10 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="Hospital"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#041b3d]/95 via-[#064b88]/85 to-[#047857]/85" />

      <div className="relative z-10 w-full max-w-md rounded-[2.3rem] border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15">
          <CheckCircle2 size={36} className="text-emerald-200" />
        </div>

        <h2 className="text-2xl font-black">Registration Successful!</h2>
        <p className="mt-2 text-sm font-medium text-white/70">
          Welcome to SmartHealthcare, {patientName}.
        </p>

        <div className="mt-6 rounded-3xl border border-blue-200/20 bg-blue-500/15 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-blue-100">
            Your Patient ID
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-3xl font-black tracking-wider">{patientId}</span>
            <button onClick={copyId} className="rounded-xl p-2 text-blue-100 hover:bg-white/10">
              <Copy size={17} />
            </button>
          </div>
          {copied && <p className="mt-1 text-xs font-bold text-emerald-200">Copied!</p>}
        </div>

        <p className="mt-4 text-xs font-medium leading-6 text-white/70">
          Your default password is same as your Patient ID.
        </p>

        <button
          type="button"
          onClick={openWelcomeWhatsApp}
          className="mt-5 flex w-full items-center justify-center rounded-2xl border border-emerald-200/40 bg-emerald-500/20 px-6 py-4 text-base font-black text-white hover:bg-emerald-500/30"
        >
          Send Welcome Message on WhatsApp
        </button>

        <button
          onClick={onContinue}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-4 text-base font-black text-white"
        >
          Continue to Login
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
