import { useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Copy,
  CreditCard,
  HeartPulse,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import Logo from "../components/Logo";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { loginPatient, loginOtp, registerWithOtp } from "../api/client";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "patient", label: "Patient ID", icon: CreditCard },
  { id: "otp", label: "Mobile + OTP", icon: Smartphone },
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

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginCardRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, homeRouteForRole } = useAuth();

  const scrollToLogin = () => {
    setActiveTab("patient");
    loginCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      document.getElementById("patient-id-input")?.focus();
    }, 450);
  };

  const redirectAfterLogin = (userInfo) => {
    if (userInfo.role === "PATIENT" && userInfo.must_change_password) {
      navigate("/change-password", { replace: true });
      return;
    }

    const from = location.state?.from?.pathname;
    navigate(from || homeRouteForRole(userInfo.role), { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041b3d] px-4 py-5 text-white">
      <img
        src="/hospitals/chennai_hospital.png"
        alt="SmartHealthcare Hospital"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#041b3d]/98 via-[#063b7a]/92 to-[#047857]/90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.30),transparent_28%),radial-gradient(circle_at_55%_92%,rgba(6,182,212,0.20),transparent_32%)]" />

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
              <span className="block text-xs text-white/70">24/7 Helpdesk</span>
              +91 98410 12345
            </span>
          </a>
        </header>

        <main className="grid min-h-[760px] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.08] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
              <img
                src="/hospitals/chennai_hospital.png"
                alt="SmartHealthcare Hospital"
                className="h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041b3d] via-[#041b3d]/50 to-transparent" />
            </div>

            <div className="pointer-events-none absolute left-[52%] top-[14%] hidden h-24 w-24 rounded-[2rem] border border-white/10 bg-white/5 lg:block" />
            <div className="pointer-events-none absolute left-[46%] top-[8%] hidden h-2 w-28 rounded-full bg-white/20 lg:block" />

            <div className="relative max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-200">
                SmartHealthcare Patient Portal
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Welcome to <br />
                <span className="text-blue-300">SmartHealthcare</span>
                <br />
                <span className="text-emerald-300">Hospital</span>
              </h1>

              <div className="mt-6 h-1.5 w-24 rounded-full bg-emerald-300" />

              <p className="mt-6 text-xl font-black text-white">
                Better Care. Better Health. Better Life.
              </p>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/80">
                Book trusted doctors, manage appointments, receive token details,
                and access your hospital services in one smart digital portal.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                <FeatureIcon icon={ShieldCheck} title="Trusted Care" text="Secure patient access" tone="blue" />
                <FeatureIcon icon={Phone} title="24/7 Support" text="Branch helpdesk" tone="green" />
                <FeatureIcon icon={HeartPulse} title="Patient First" text="Care-first service" tone="red" />
                <FeatureIcon icon={Stethoscope} title="Expert Doctors" text="Smart booking" tone="purple" />
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
                <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
                    <CalendarPlus size={28} />
                  </div>

                  <div>
                    <p className="text-base font-black text-white">
                      Book an Appointment
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/75">
                      Skip the wait. Login with Patient ID and book your slot in seconds.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToLogin}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
                  >
                    Book Now
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-center sm:grid-cols-4">
                <TrustStat value="1000+" label="Happy Patients" />
                <TrustStat value="50+" label="Expert Doctors" />
                <TrustStat value="10+" label="Specialties" />
                <TrustStat value="10" label="TN Branches" />
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
              <div className="mb-7">
                <h2 className="text-3xl font-black text-white">Patient Login</h2>
                <div className="mt-3 h-1 w-16 rounded-full bg-emerald-300" />
                <p className="mt-4 text-sm font-medium text-white/75">
                  Login to continue appointment booking and manage your care.
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/15 bg-white/10 p-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setError("");
                      }}
                      className={`relative flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-black transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-white/65 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="tab-bg"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 shadow-sm"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                      <Icon size={16} className="relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

              <div className="[&_label]:text-white/90 [&_input]:border-white/15 [&_input]:bg-white/95 [&_select]:bg-white">
                <AnimatePresence mode="wait">
                  {activeTab === "otp" && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <OtpLoginForm
                        setError={setError}
                        loading={loading}
                        setLoading={setLoading}
                        onSuccess={(res) => redirectAfterLogin(login(res.data))}
                      />
                    </motion.div>
                  )}

                  {activeTab === "patient" && (
                    <motion.div
                      key="patient"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                    >
                      <PatientIdLoginForm
                        setError={setError}
                        loading={loading}
                        setLoading={setLoading}
                        onSuccess={(res) => redirectAfterLogin(login(res.data))}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-7 text-center text-sm text-white/75">
                New patient?{" "}
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 font-black text-emerald-200 hover:underline"
                >
                  <UserPlus size={14} />
                  Create an account
                </Link>

                <div className="mt-3 text-xs text-white/60">
                  Hospital staff?{" "}
                  <Link
                    to="/admin/login"
                    className="font-black text-cyan-200 hover:underline"
                  >
                    Go to Staff Portal
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="rounded-[1.8rem] border border-emerald-200/20 bg-emerald-400/10 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-emerald-200 shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-base font-black text-white">
                    Your Health, Our Priority
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-white/75">
                    Your data is secure with us. We follow privacy and safety-first healthcare practices.
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

function FeatureIcon({ icon: Icon, title, text, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-3xl bg-white/80 p-4 text-center shadow-sm ring-1 ring-blue-50">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon size={25} />
      </div>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function TrustStat({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/75 px-4 py-3 shadow-sm ring-1 ring-blue-50">
      <p className="text-lg font-black text-blue-700">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function PatientIdLoginForm({ setError, loading, setLoading, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);

    try {
      const res = await loginPatient(
        data.patient_id.trim().toUpperCase(),
        data.password
      );
      onSuccess(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid Patient ID or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        id="patient-id-input"
        label="Patient ID"
        icon={CreditCard}
        placeholder="PTNC005"
        autoComplete="username"
        error={errors.patient_id?.message}
        {...register("patient_id", { required: "Patient ID is required" })}
      />

      <FormInput
        label="Password"
        icon={Lock}
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password", { required: "Password is required" })}
      />

      <p className="text-xs text-gray-500">
        First time logging in? Your default password is the same as your Patient ID.
      </p>

      <Button type="submit" loading={loading}>
        Login <ArrowRight size={16} />
      </Button>
    </form>
  );
}

function OtpLoginForm({ setError, loading, setLoading, onSuccess }) {
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState(null);

  const [registerData, setRegisterData] = useState({
    first_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    blood_group: "",
    email: "",
    address: "",
    locality: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "",
  });

  const sendOtp = (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    const generated = String(Math.floor(100000 + Math.random() * 900000));

    setTimeout(() => {
      setMockOtp(generated);
      setStep("otp");
      setLoading(false);
    }, 500);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (otp !== mockOtp) {
      setError("Incorrect OTP. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginOtp(mobile, otp);
      onSuccess(res);
    } catch (err) {
      if (err.response?.status === 404) {
        setStep("register");
        setError("Mobile number not registered. Please complete registration.");
      } else {
        setError(err.response?.data?.detail || "OTP login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const registerNewPatient = async (e) => {
    e.preventDefault();
    setError("");

    if (!registerData.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    if (!registerData.city) {
      setError("City is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...registerData,
        phone: mobile,
        otp,
        dob: registerData.dob || null,
        email: registerData.email || null,
      };

      const res = await registerWithOtp(payload);
      onSuccess(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "mobile") {
    return (
      <form onSubmit={sendOtp} className="space-y-4">
        <FormInput
          label="Mobile Number"
          icon={Smartphone}
          placeholder="98765 43210"
          maxLength={10}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
        />

        <Button type="submit" loading={loading}>
          Send OTP <ArrowRight size={16} />
        </Button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-700">
          OTP sent to <span className="font-semibold">+91 {mobile}</span>.{" "}
          <span className="text-xs text-primary-500">
            Demo OTP: <strong>{mockOtp}</strong>
          </span>
        </div>

        <FormInput
          label="Enter OTP"
          icon={KeyRound}
          placeholder="6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <Button type="submit" loading={loading}>
          Verify & Continue <ArrowRight size={16} />
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("mobile");
            setOtp("");
            setError("");
          }}
          className="w-full text-center text-xs font-medium text-primary-600 hover:underline"
        >
          Change mobile number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={registerNewPatient} className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        OTP verified for <span className="font-semibold">+91 {mobile}</span>.
        Complete registration to create your patient account.
      </div>

      <FormInput
        label="First Name"
        placeholder="Enter first name"
        value={registerData.first_name}
        onChange={(e) =>
          setRegisterData({ ...registerData, first_name: e.target.value })
        }
      />

      <FormInput
        label="Last Name"
        placeholder="Enter last name"
        value={registerData.last_name}
        onChange={(e) =>
          setRegisterData({ ...registerData, last_name: e.target.value })
        }
      />

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Gender
        </label>
        <select
          value={registerData.gender}
          onChange={(e) =>
            setRegisterData({ ...registerData, gender: e.target.value })
          }
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <FormInput
        label="Date of Birth"
        type="date"
        value={registerData.dob}
        onChange={(e) =>
          setRegisterData({ ...registerData, dob: e.target.value })
        }
      />

      <FormInput
        label="Blood Group"
        placeholder="O+"
        value={registerData.blood_group}
        onChange={(e) =>
          setRegisterData({ ...registerData, blood_group: e.target.value })
        }
      />

      <FormInput
        label="Email"
        type="email"
        placeholder="example@gmail.com"
        value={registerData.email}
        onChange={(e) =>
          setRegisterData({ ...registerData, email: e.target.value })
        }
      />

      <FormInput
        label="Address"
        placeholder="Enter address"
        value={registerData.address}
        onChange={(e) =>
          setRegisterData({ ...registerData, address: e.target.value })
        }
      />

      <FormInput
        label="Locality"
        placeholder="Enter locality"
        value={registerData.locality}
        onChange={(e) =>
          setRegisterData({ ...registerData, locality: e.target.value })
        }
      />

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          City
        </label>
        <select
          value={registerData.city}
          onChange={(e) =>
            setRegisterData({ ...registerData, city: e.target.value })
          }
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {TN_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <FormInput
        label="Pincode"
        placeholder="600001"
        maxLength={6}
        value={registerData.pincode}
        onChange={(e) =>
          setRegisterData({
            ...registerData,
            pincode: e.target.value.replace(/\D/g, ""),
          })
        }
      />

      <Button type="submit" loading={loading}>
        Create Account & Login <ArrowRight size={16} />
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep("mobile");
          setOtp("");
          setError("");
        }}
        className="w-full text-center text-xs font-medium text-primary-600 hover:underline"
      >
        Use another mobile number
      </button>
    </form>
  );
}
