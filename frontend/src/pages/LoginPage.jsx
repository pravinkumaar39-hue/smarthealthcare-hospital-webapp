import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  CreditCard,
  Lock,
  Smartphone,
  KeyRound,
  ArrowRight,
  UserPlus,
} from "lucide-react";

import Logo from "../components/Logo";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { loginPatient, loginOtp, registerWithOtp } from "../api/client";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "otp", label: "Mobile + OTP", icon: Smartphone },
  { id: "patient", label: "Patient ID", icon: CreditCard },
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

  const navigate = useNavigate();
  const location = useLocation();
  const { login, homeRouteForRole } = useAuth();

  const redirectAfterLogin = (userInfo) => {
    if (userInfo.role === "PATIENT" && userInfo.must_change_password) {
      navigate("/change-password", { replace: true });
      return;
    }

    const from = location.state?.from?.pathname;
    navigate(from || homeRouteForRole(userInfo.role), { replace: true });
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
        <p className="font-medium text-primary-700/80">
          SmartHealthcare Patient Portal
        </p>
        <p className="text-sm text-primary-600/70">
          Book appointments, view doctors, and manage your care
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card z-10 w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-primary-50/80 p-1">
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
                className={`relative flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors sm:text-xs ${
                  isActive
                    ? "text-primary-700"
                    : "text-gray-500 hover:text-primary-600"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
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
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

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

        <div className="mt-6 text-center text-sm text-gray-600">
          New patient?{" "}
          <Link
            to="/register"
            className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline"
          >
            <UserPlus size={14} />
            Create an account
          </Link>

          <div className="mt-3 text-xs text-gray-500">
            Hospital staff?{" "}
            <Link
              to="/admin/login"
              className="font-semibold text-primary-700 hover:underline"
            >
              Go to Staff Portal
            </Link>
          </div>
        </div>
      </motion.div>

      <p className="z-10 mt-6 text-center text-xs text-primary-700/60">
        © {new Date().getFullYear()} SmartHealthcare Hospital Network · Tamil Nadu
      </p>
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
        label="Patient ID"
        icon={CreditCard}
        placeholder="PTN0001"
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