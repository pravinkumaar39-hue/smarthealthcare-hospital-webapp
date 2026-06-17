import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Droplet,
  FileText,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  User,
  UserRound,
  Wallet,
} from "lucide-react";

import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentUser,
  getDoctors,
  getMyAppointments,
  bookAppointment,
  getAdminAppointments,
} from "../api/client";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"];

const BRANCHES = [
  { id: "BR001", city: "Chennai", address: "Anna Nagar, Chennai", phone: "9841012345" },
  { id: "BR002", city: "Trichy", address: "Thillai Nagar, Trichy", phone: "9842012345" },
  { id: "BR003", city: "Madurai", address: "KK Nagar, Madurai", phone: "9843012345" },
  { id: "BR004", city: "Coimbatore", address: "RS Puram, Coimbatore", phone: "9844012345" },
  { id: "BR005", city: "Thanjavur", address: "Medical College Road, Thanjavur", phone: "9845012345" },
  { id: "BR006", city: "Salem", address: "Fairlands, Salem", phone: "9846012345" },
  { id: "BR007", city: "Tirunelveli", address: "Palayamkottai, Tirunelveli", phone: "9847012345" },
  { id: "BR008", city: "Erode", address: "Perundurai Road, Erode", phone: "9848012345" },
  { id: "BR009", city: "Vellore", address: "Katpadi Road, Vellore", phone: "9849012345" },
  { id: "BR010", city: "Hosur", address: "Bagalur Road, Hosur", phone: "9850012345" },
];

const HOSPITAL_IMAGES = {
  Chennai: "/hospitals/chennai_hospital.png",
  Trichy: "/hospitals/trichy_hospital.png",
  Madurai: "/hospitals/madurai_hospital.png",
  Coimbatore: "/hospitals/coimbatore_hospital.png",
  Thanjavur: "/hospitals/thanjavur_hospital.png",
  Salem: "/hospitals/salem_hospital.png",
  Tirunelveli: "/hospitals/tirunelveli_hospital.png",
  Erode: "/hospitals/erode_hospital.png",
  Vellore: "/hospitals/vellore_hospital.png",
  Hosur: "/hospitals/hosur_hospital.png",
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = String(dateValue).split("-");
  return `${day} ${months[Number(month) - 1]} ${year}`;
}

function formatTime(slot) {
  if (!slot) return "-";
  const [h, m = "00"] = String(slot).split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return slot;
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function getUpcomingAppointment(appointments) {
  const today = todayDate();
  return [...appointments]
    .filter((a) => a.appointment_date >= today && !["Cancelled", "Completed", "No-Show"].includes(a.status))
    .sort((a, b) => {
      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return (a.token_number || 9999) - (b.token_number || 9999);
    })[0] || null;
}

function getRecentAppointments(appointments) {
  return [...appointments]
    .sort((a, b) => {
      const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return (b.token_number || 0) - (a.token_number || 0);
    })
    .slice(0, 3);
}

function findDoctor(doctors, doctorId) {
  return doctors.find((d) => d.doctor_id === doctorId);
}

function doctorDisplayName(doctors, doctorId) {
  const doctor = findDoctor(doctors, doctorId);
  if (!doctor) return `Doctor ${doctorId}`;

  const name = `Dr. ${doctor.first_name || ""} ${doctor.last_name || ""}`.trim();
  if (name === "Dr.") return `Doctor ${doctorId}`;

  return `${name} (${doctor.doctor_id})`;
}

function getDoctorForAppointment(doctors, appointment) {
  const doctor = findDoctor(doctors, appointment?.doctor_id);
  if (doctor) return doctor;

  const doctorName = appointment?.doctor_name || appointment?.doctor_full_name || "";
  const cleanName = doctorName.replace(/^Dr\.?\s*/i, "").trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);

  return {
    doctor_id: appointment?.doctor_id || "DOC",
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    gender: appointment?.doctor_gender || "Male",
    department: appointment?.doctor_department || appointment?.department || "Doctor",
    qualification: appointment?.doctor_qualification || "",
    experience_yrs: appointment?.doctor_experience_yrs ?? null,
    rating: appointment?.doctor_rating ?? null,
    active: appointment?.doctor_active ?? true,
    branch_id: appointment?.branch_id || "",
    consult_fee: appointment?.consult_fee || 0,
  };
}

function doctorTitle(doctor, doctorId) {
  const id = doctor?.doctor_id || doctorId || "";
  const first = doctor?.first_name || "";
  const last = doctor?.last_name || "";
  const name = `${first} ${last}`.trim();

  if (!name) return `Doctor ${id}`;

  return `Dr. ${name}${id ? ` (${id})` : ""}`;
}

function getStatusClass(status) {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Cancelled") return "bg-red-100 text-red-700";
  if (status === "No-Show") return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

const FEMALE_FIRST_NAMES = new Set([
  "aaradhya",
  "aishwarya",
  "anjali",
  "anitha",
  "anu",
  "anuja",
  "arunima",
  "deepa",
  "divya",
  "geetha",
  "janani",
  "kavya",
  "keerthana",
  "lakshmi",
  "leela",
  "meena",
  "nithya",
  "pooja",
  "priya",
  "ramya",
  "revathi",
  "sangeetha",
  "sneha",
  "swetha",
  "vidya",
]);

const MALE_FIRST_NAMES = new Set([
  "akash",
  "arjun",
  "arun",
  "balaji",
  "gandhi",
  "gowtham",
  "hari",
  "karthik",
  "kumar",
  "lokesh",
  "mahesh",
  "mohan",
  "pravin",
  "rahul",
  "rajesh",
  "ramesh",
  "sanjay",
  "sathish",
  "suresh",
  "vignesh",
  "vijay",
  "wazir",
]);

function getFirstNameFromText(value) {
  const cleanValue = String(value || "")
    .replace(/^dr\.?\s*/i, "")
    .trim();

  return cleanValue.split(/\s+/).filter(Boolean)[0] || "";
}

function inferGenderFromName(name) {
  const firstName = getFirstNameFromText(name).toLowerCase();

  if (FEMALE_FIRST_NAMES.has(firstName)) return "female";
  if (MALE_FIRST_NAMES.has(firstName)) return "male";

  return "";
}

function normalizeGenderFromValue(value) {
  const gender = String(value || "").trim().toLowerCase();

  if (["female", "f", "woman", "lady"].includes(gender)) return "female";
  if (["male", "m", "man", "gentleman"].includes(gender)) return "male";

  return "";
}

function getDoctorGender(doctor) {
  // Trust backend gender first.
  // Your database has DOC0130 = Female, so this must select female image.
  const apiGender = normalizeGenderFromValue(doctor?.gender || doctor?.doctor_gender);
  if (apiGender) return apiGender;

  // Use first name only as fallback when backend gender is missing.
  const fullName =
    doctor?.doctor_name ||
    `${doctor?.first_name || ""} ${doctor?.last_name || ""}`.trim();

  const nameGender = inferGenderFromName(fullName);
  if (nameGender) return nameGender;

  return "male";
}

function getPatientGender(profile) {
  // Trust backend gender first when available.
  const apiGender = normalizeGenderFromValue(profile?.gender);
  if (apiGender) return apiGender;

  // Use first name as fallback.
  const fullName =
    profile?.name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

  const nameGender = inferGenderFromName(fullName);
  if (nameGender) return nameGender;

  return "male";
}

function calculateAgeFromDob(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getDoctorImage(doctor) {
  const gender = getDoctorGender(doctor);
  const experience = Number(
    doctor?.experience_yrs ?? doctor?.doctor_experience_yrs ?? 0
  );

  // Temporary doctor age rule:
  // Your doctors table has experience_yrs, not doctor DOB/age.
  // So 15+ years experience is treated as senior.
  const isSenior = experience >= 15;

  if (gender === "female") {
    return isSenior
      ? "/avatars/doctors/doctor_female_senior.png"
      : "/avatars/doctors/doctor_female_young.png";
  }

  return isSenior
    ? "/avatars/doctors/doctor_male_senior.png"
    : "/avatars/doctors/doctor_male_young.png";
}

function getPatientImage(profile) {
  const gender = getPatientGender(profile);

  // Patient age is calculated from DOB when backend sends dob.
  // If dob is not available, it falls back to young image.
  const calculatedAge = profile?.age ?? calculateAgeFromDob(profile?.dob);
  const isSenior = Number(calculatedAge || 0) >= 50;

  if (gender === "female") {
    return isSenior
      ? "/avatars/patients/patient_female_senior.png"
      : "/avatars/patients/patient_female_young.png";
  }

  return isSenior
    ? "/avatars/patients/patient_male_senior.png"
    : "/avatars/patients/patient_male_young.png";
}

function isDoctorActive(doctor) {
  const activeValue = doctor?.active ?? doctor?.doctor_active;

  if (
    activeValue === false ||
    activeValue === 0 ||
    activeValue === "0" ||
    String(activeValue).toLowerCase() === "false"
  ) {
    return false;
  }

  return true;
}

function doctorStatusLabel(doctor) {
  return isDoctorActive(doctor) ? "Active" : "Inactive";
}

function doctorStatusClass(doctor) {
  return isDoctorActive(doctor)
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

function DoctorStatusDot({ doctor, light = false }) {
  const active = isDoctorActive(doctor);
  const dotColor = active ? "bg-emerald-500" : "bg-red-500";
  const textColor = light
    ? "text-white/85"
    : active
    ? "text-emerald-700"
    : "text-red-700";

  return (
    <span className={`inline-flex items-center gap-2 font-black ${textColor}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function doctorRating(doctor) {
  const rating = doctor?.rating ?? doctor?.doctor_rating;

  if (rating === null || rating === undefined || rating === "") {
    return "New";
  }

  return `${Number(rating).toFixed(2)} â˜…`;
}

function doctorExperience(doctor) {
  const years = doctor?.experience_yrs ?? doctor?.doctor_experience_yrs;

  if (years === null || years === undefined || years === "") {
    return "Experience not updated";
  }

  const numericYears = Number(years);

  if (numericYears === 0) return "New doctor";
  if (numericYears === 1) return "1 yr experience";

  return `${numericYears} yrs experience`;
}

function DoctorAvatar({ doctor, size = "lg" }) {
  const dimensions =
    size === "sm"
      ? "h-12 w-12 rounded-2xl"
      : size === "xl"
      ? "h-24 w-24 rounded-3xl"
      : "h-16 w-16 rounded-3xl";

  return (
    <img
      src={getDoctorImage(doctor)}
      alt={doctorTitle(doctor, doctor?.doctor_id)}
      className={`${dimensions} shrink-0 object-cover ring-1 ring-blue-100`}
      title={doctorTitle(doctor, doctor?.doctor_id)}
      onError={(event) => {
        event.currentTarget.src = "/avatars/doctors/doctor_male_young.png";
      }}
    />
  );
}

function PatientAvatar({ profile, size = "md" }) {
  const dimensions =
    size === "lg" ? "h-28 w-28 rounded-full" : "h-12 w-12 rounded-full";

  return (
    <img
      src={getPatientImage(profile)}
      alt={profile?.name || "Patient"}
      className={`${dimensions} shrink-0 object-cover ring-1 ring-blue-100`}
      title={profile?.name || "Patient"}
      onError={(event) => {
        event.currentTarget.src = "/avatars/patients/patient_male_young.png";
      }}
    />
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl ${className}`}>
      {children}
    </div>
  );
}

function PatientLayout({ children, activeView, setActiveView, profile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayUser = profile || user;

  const supportBranch = BRANCHES.find(
    (branch) =>
      branch.id === displayUser?.branch_id ||
      branch.id === displayUser?.home_branch_id ||
      branch.city === displayUser?.city
  );

  const supportPhone = supportBranch?.phone || "1800-123-4567";
  const supportCity =
    supportBranch?.city || displayUser?.city || "SmartHealthcare";

  const currentBranch = supportBranch || BRANCHES.find(
    (branch) => branch.city === displayUser?.city
  );

  const hospitalImage =
    HOSPITAL_IMAGES[currentBranch?.city] ||
    HOSPITAL_IMAGES[displayUser?.city] ||
    "/hospitals/chennai_hospital.png";

  const hospitalCity = currentBranch?.city || displayUser?.city || "Chennai";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "book", label: "Book Appointment", icon: CalendarPlus },
    { id: "appointments", label: "My Appointments", icon: CalendarCheck },
    { id: "ai", label: "AI Health Assistant", icon: Sparkles },
    { id: "summary", label: "Medical Summary", icon: FileText },
    { id: "branches", label: "Hospital Branches", icon: Building2 },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041b3d] text-slate-950">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hospitalImage})` }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#041b3d]/96 via-[#063b7a]/86 to-[#047857]/82" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(16,185,129,0.30),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.18),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 backdrop-blur-[1.4px]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 p-4 lg:flex">
          <div className="relative flex w-full flex-col overflow-hidden rounded-[30px] border border-white/15 bg-gradient-to-b from-[#031733] via-[#0648b8] to-[#047857] p-5 text-white shadow-2xl shadow-black/30">
            <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(650px_240px_at_0%_0%,rgba(96,165,250,0.55),transparent_58%),radial-gradient(420px_220px_at_100%_80%,rgba(16,185,129,0.35),transparent_58%)]" />
            <div className="relative mb-7">
              <Logo
                size="sm"
                variant="sidebar"
                city={hospitalCity}
                subtitle="Patient Portal"
              />
            </div>

            <nav className="relative flex-1 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition-all duration-200 ${
                      active ? "bg-white text-blue-700 shadow-lg" : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </nav>

            <div className="relative mt-4">
              <button onClick={handleLogout} className="mb-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10 hover:text-white">
                <LogOut className="h-5 w-5" /> Logout
              </button>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-300 to-cyan-300 text-blue-950">
                    <CreditCard size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black">Need Help?</p>
                    <p className="truncate text-xs text-white/70">
                      {supportCity} Support
                    </p>
                    <a
                      href={`tel:${supportPhone}`}
                      className="mt-1 block text-xs font-black text-white"
                    >
                      {supportPhone}
                    </a>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-h-screen min-w-0 flex-1">
          <header className="px-6 pb-2 pt-8 lg:px-10">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 lg:hidden">
                  <button className="rounded-2xl border border-white/15 bg-white/15 p-2 text-white backdrop-blur-xl"><Menu size={20} /></button>
                  <Logo size="sm" compact subtitle="Patient Portal" city={hospitalCity} />
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow lg:mt-0 lg:text-4xl">
                  Good Evening, <span className="bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">{displayUser?.name || "Patient"}</span>
                </h1>
                <p className="mt-2 text-sm font-medium text-white/75 lg:text-base">Take care of your health. We are here to help you stay on top of every visit.</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button className="hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-xl md:flex">
                  <MapPin className="h-4 w-4 text-emerald-200" /> {displayUser?.city || "Chennai"} <ChevronDown className="h-4 w-4 text-white/55" />
                </button>
                <button className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/15 text-white shadow-sm backdrop-blur-xl">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <button onClick={() => setActiveView("profile")} className="rounded-2xl"><PatientAvatar profile={displayUser} /></button>
              </div>
            </div>
          </header>
          <div className="px-6 py-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [activeView, setActiveView] = useState("dashboard");
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(todayDate());
  const [slotTime, setSlotTime] = useState("10:00");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor.doctor_id === selectedDoctorId), [doctors, selectedDoctorId]);
  const upcomingAppointment = useMemo(() => getUpcomingAppointment(appointments), [appointments]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const profileRes = await getCurrentUser();
      const profileData = profileRes.data;
      setProfile(profileData);

      const patientBranch =
        BRANCHES.find((branch) => branch.id === profileData?.branch_id) ||
        BRANCHES.find((branch) => branch.id === profileData?.home_branch_id) ||
        BRANCHES.find((branch) => branch.city === profileData?.city);

      const patientBranchId =
        profileData?.branch_id ||
        profileData?.home_branch_id ||
        patientBranch?.id;

      const doctorParams = { active_only: false };

      if (patientBranchId) {
        doctorParams.branch_id = patientBranchId;
      } else if (profileData?.city) {
        doctorParams.city = profileData.city;
      }

      const appointmentRes = await getMyAppointments();

      let doctorData = [];
      try {
        const doctorRes = await getDoctors(doctorParams);
        doctorData = doctorRes.data || [];
      } catch (doctorErr) {
        doctorData = [];
      }

      // Safety fallback:
      // Some backends may not filter doctors correctly by city/branch.
      // So we fetch all doctors once and filter locally.
      if (doctorData.length === 0) {
        try {
          const allDoctorRes = await getDoctors({ active_only: false });
          const allDoctors = allDoctorRes.data || [];

          const localBranchDoctors = patientBranchId
            ? allDoctors.filter((doctor) => doctor.branch_id === patientBranchId)
            : [];

          const localCityDoctors = profileData?.city
            ? allDoctors.filter((doctor) => doctor.city === profileData.city)
            : [];

          doctorData =
            localBranchDoctors.length > 0
              ? localBranchDoctors
              : localCityDoctors.length > 0
              ? localCityDoctors
              : allDoctors;
        } catch (fallbackErr) {
          doctorData = [];
        }
      }

      const appointmentData = appointmentRes.data || [];

      setDoctors(doctorData);
      setAppointments(appointmentData);

      if (doctorData.length > 0) {
        setSelectedDoctorId((currentValue) =>
          doctorData.some((doctor) => doctor.doctor_id === currentValue)
            ? currentValue
            : doctorData[0].doctor_id
        );
      } else {
        setSelectedDoctorId("");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data. Please login again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedDoctor) {
      setError("Please select a doctor.");
      return;
    }
    setBooking(true);
    try {
      const payload = {
        doctor_id: selectedDoctor.doctor_id,
        branch_id: selectedDoctor.branch_id,
        department: selectedDoctor.department,
        appointment_date: appointmentDate,
        slot_time: slotTime,
        payment_mode: paymentMode,
      };
      const res = await bookAppointment(payload);
      setSuccess(`Appointment booked successfully. Token ${res.data.token_number}, estimated wait ${res.data.estimated_wait_minutes} mins.`);
      await loadDashboardData();
      setActiveView("dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Appointment booking failed. Please try another slot.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <PatientLayout activeView={activeView} setActiveView={setActiveView} profile={profile}>
      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm font-bold text-red-700">{error}</div>}
      {success && <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700">{success}</div>}
      {activeView === "dashboard" && <DashboardHome profile={profile} loading={loading} doctors={doctors} appointments={appointments} upcomingAppointment={upcomingAppointment} setActiveView={setActiveView} />}
      {activeView === "book" && <BookAppointmentView doctors={doctors} selectedDoctorId={selectedDoctorId} setSelectedDoctorId={setSelectedDoctorId} selectedDoctor={selectedDoctor} appointmentDate={appointmentDate} setAppointmentDate={setAppointmentDate} slotTime={slotTime} setSlotTime={setSlotTime} paymentMode={paymentMode} setPaymentMode={setPaymentMode} booking={booking} handleBookAppointment={handleBookAppointment} loading={loading} />}
      {activeView === "appointments" && <AppointmentsView appointments={appointments} doctors={doctors} />}
      {activeView === "ai" && <AIHealthAssistantView />}
      {activeView === "summary" && <MedicalSummaryView user={profile} appointments={appointments} />}
      {activeView === "branches" && <BranchesView user={profile} />}
      {activeView === "profile" && <ProfileView user={profile} appointments={appointments} />}
    </PatientLayout>
  );
}

function DashboardHome({ profile, loading, doctors, appointments, upcomingAppointment, setActiveView }) {
  const recent = getRecentAppointments(appointments);
  const upcomingDoctor = upcomingAppointment ? getDoctorForAppointment(doctors, upcomingAppointment) : null;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AppointmentCard profile={profile} loading={loading} appointment={upcomingAppointment} doctor={upcomingDoctor} doctors={doctors} setActiveView={setActiveView} />
        <TokenCard appointment={upcomingAppointment} />
        <HealthSummaryCard setActiveView={setActiveView} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentAppointments appointments={recent} doctors={doctors} setActiveView={setActiveView} />
        <NotificationsCard upcomingAppointment={upcomingAppointment} profile={profile} />
      </div>
      <QuickActions setActiveView={setActiveView} />
    </div>
  );
}

function AppointmentCard({ profile, loading, appointment, doctor, doctors, setActiveView }) {
  if (loading) return <GlassCard className="min-h-[300px]"><p className="text-base text-slate-500">Loading appointment...</p></GlassCard>;
  if (!appointment) {
    return (
      <GlassCard className="min-h-[300px]">
        <div className="flex items-start justify-between">
          <div><p className="text-xs uppercase tracking-widest text-slate-400">Upcoming Appointment</p><h3 className="mt-1 text-2xl font-black">No active booking</h3></div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays className="h-5 w-5" /></div>
        </div>
        <p className="mt-5 text-base text-slate-500">No upcoming scheduled appointment found.</p>
        <button onClick={() => setActiveView("book")} className="mt-6 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-100">Book Appointment</button>
      </GlassCard>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white shadow-[0_24px_60px_rgba(37,99,235,0.30)]">
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div><p className="text-xs uppercase tracking-widest text-white/70">Upcoming Appointment</p><h3 className="mt-1 text-2xl font-black">{formatDate(appointment.appointment_date)}</h3></div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20"><CalendarDays className="h-5 w-5" /></div>
      </div>
      <div className="relative mt-6 flex items-center gap-4">
        <DoctorAvatar doctor={doctor} size="lg" />
        <div className="min-w-0">
          <p className="text-xl font-black leading-tight break-words">
            {doctorTitle(doctor, appointment.doctor_id)}
          </p>
          <p className="text-sm text-white/85">
            {appointment.department} Â· SmartHealthcare, {profile?.city || "Chennai"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-white/80">
            <span>{doctorExperience(doctor)}</span>
            <span>Â·</span>
            <span>{doctorRating(doctor)}</span>
            <span>Â·</span>
            <DoctorStatusDot doctor={doctor} light />
          </p>
        </div>
      </div>
      <div className="relative mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <Meta icon={CalendarDays} label={formatDate(appointment.appointment_date)} />
        <Meta icon={Clock} label={formatTime(appointment.slot_time)} />
        <Meta icon={MapPin} label={`Branch ${appointment.branch_id}`} />
      </div>
      <button onClick={() => setActiveView("appointments")} className="relative mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-md hover:shadow-lg">View Details <ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

function Meta({ icon: Icon, label }) {
  return <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15"><Icon className="h-4 w-4 shrink-0" /><span className="truncate text-xs font-bold">{label}</span></div>;
}

function TokenCard({ appointment }) {
  return (
    <GlassCard className="relative min-h-[300px] overflow-hidden">
      <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-400">Token Number</p><h3 className="mt-1 text-lg font-black">Today&apos;s Queue Position</h3></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Clock className="h-5 w-5" /></div></div>
      <div className="mt-5 flex items-end gap-4"><div className="relative"><div className="bg-gradient-to-r from-blue-700 to-emerald-500 bg-clip-text text-7xl font-black leading-none text-transparent">{appointment?.token_number ? String(appointment.token_number).padStart(2, "0") : "--"}</div></div><div className="pb-2"><p className="text-xs text-slate-500">Your token for</p><p className="text-lg font-black">{appointment ? formatTime(appointment.slot_time) : "No active token"}</p></div></div>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500" style={{ width: appointment?.token_number ? `${Math.min(100, appointment.token_number * 12)}%` : "0%" }} /></div>
      <div className="mt-5 flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-500"><Clock className="h-4 w-4" />Estimated wait</span><span className="font-black text-emerald-600">{appointment?.estimated_wait_minutes ?? "--"} mins</span></div>
    </GlassCard>
  );
}

function HealthSummaryCard({ setActiveView }) {
  return (
    <GlassCard className="min-h-[300px]">
      <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-400">Health Summary</p><h3 className="mt-1 text-lg font-black">Personal vitals snapshot</h3></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500"><Heart className="h-5 w-5" fill="currentColor" /></div></div>
      <div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 p-4 text-white shadow-md"><p className="text-xs uppercase tracking-wider text-white/80">Blood Group</p><p className="mt-1 text-4xl font-black">B+</p><p className="mt-1 text-xs text-white/80">Demo profile</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Age</p><p className="mt-1 bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-4xl font-black text-transparent">35</p><p className="mt-1 text-xs text-slate-500">Years</p></div></div>
      <button onClick={() => setActiveView("profile")} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-700"><User className="h-4 w-4" />View Profile <ChevronRight className="h-4 w-4" /></button>
    </GlassCard>
  );
}

function RecentAppointments({ appointments, doctors, setActiveView }) {
  return (
    <GlassCard className="lg:col-span-2">
      <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Recent Appointments</h3><p className="text-sm text-slate-500">Your latest consultations</p></div><button onClick={() => setActiveView("appointments")} className="text-sm font-black text-blue-700">View All</button></div>
      <ul className="mt-5 space-y-3">
        {appointments.length === 0 ? <li className="rounded-2xl border border-dashed border-blue-100 bg-white/60 p-6 text-center text-sm text-slate-500">No recent appointments.</li> : appointments.map((appointment) => {
          const doctor = getDoctorForAppointment(doctors, appointment);
          return <li key={appointment.appointment_id} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-blue-100 bg-white/65 p-4 transition hover:border-blue-300 hover:shadow-md" onClick={() => setActiveView("appointments")}><DoctorAvatar doctor={doctor} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-black">{doctorTitle(doctor, appointment.doctor_id)}</p><p className="text-sm text-slate-500">{appointment.department} Â· {doctorExperience(doctor)}</p></div><div className="hidden text-sm font-semibold text-slate-500 sm:block">{formatDate(appointment.appointment_date)}</div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClass(appointment.status)}`}>{appointment.status}</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" /></li>;
        })}
      </ul>
    </GlassCard>
  );
}

function NotificationsCard({ upcomingAppointment, profile }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Notifications</h3><p className="text-sm text-slate-500">Latest updates</p></div><button className="text-sm font-black text-blue-700">View All</button></div>
      <ul className="mt-5 space-y-3"><NotificationItem icon={Bell} title="Your appointment is confirmed" text={upcomingAppointment ? `${formatDate(upcomingAppointment.appointment_date)}, ${formatTime(upcomingAppointment.slot_time)}` : "Book an appointment to receive token details."} tone="primary" /><NotificationItem icon={Building2} title={`Health camp at ${profile?.city || "Chennai"} hospital`} text="20 July 2026" tone="accent" /><NotificationItem icon={Wallet} title="Discount on full body checkup" text="Till 31 July 2026" tone="success" /></ul>
    </GlassCard>
  );
}

function NotificationItem({ icon: Icon, title, text, tone = "primary" }) {
  const toneClass = tone === "success" ? "bg-emerald-50 text-emerald-600" : tone === "accent" ? "bg-cyan-50 text-cyan-600" : "bg-blue-50 text-blue-700";
  return <li className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition hover:bg-blue-50/60"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{title}</p><p className="mt-0.5 text-xs text-slate-500">{text}</p></div><ChevronRight className="mt-2.5 h-4 w-4 text-slate-400" /></li>;
}

function QuickActions({ setActiveView }) {
  const actions = [
    { label: "Book Appointment", icon: CalendarPlus, tone: "from-violet-500 to-indigo-500", view: "book" },
    { label: "Ask AI Assistant", icon: Sparkles, tone: "from-fuchsia-500 to-pink-500", view: "ai" },
    { label: "Medical Records", icon: FileText, tone: "from-emerald-500 to-teal-500", view: "summary" },
    { label: "Find a Branch", icon: Building2, tone: "from-amber-500 to-orange-500", view: "branches" },
  ];
  return <GlassCard><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Quick Actions</h3><p className="text-sm text-slate-500">Jump right in</p></div></div><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{actions.map((action) => { const Icon = action.icon; return <button key={action.label} onClick={() => setActiveView(action.view)} className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white/65 p-4 text-left transition hover:-translate-y-1 hover:shadow-xl"><div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${action.tone} text-white shadow-md`}><Icon className="h-5 w-5" /></div><p className="mt-3 text-sm font-black">{action.label}</p><div className="mt-1 flex items-center gap-1 text-xs font-black text-blue-700">Go<ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></div></button>; })}</div></GlassCard>;
}


const UPI_APPS = [
  { id: "gpay", name: "GPay", short: "G", color: "from-blue-600 to-emerald-500" },
  { id: "phonepe", name: "PhonePe", short: "à¤ªà¥‡", color: "from-violet-600 to-purple-500" },
  { id: "paytm", name: "Paytm", short: "P", color: "from-sky-500 to-blue-700" },
  { id: "bhim", name: "BHIM", short: "B", color: "from-orange-500 to-green-600" },
];

const CARD_TYPES = [
  { id: "visa", name: "Visa", accent: "bg-blue-600" },
  { id: "mastercard", name: "Mastercard", accent: "bg-orange-500" },
  { id: "rupay", name: "RuPay", accent: "bg-emerald-600" },
  { id: "debit", name: "Credit / Debit", accent: "bg-slate-700" },
];

function DemoQrCode() {
  const filledCells = new Set([0,1,2,4,5,6,7,14,21,28,35,42,43,44,9,10,11,16,23,30,37,38,39,13,20,27,34,41,45,46,47,48,18,24,32,40]);
  return (
    <div className="grid h-44 w-44 grid-cols-7 gap-1 rounded-3xl bg-white p-4 shadow-inner ring-1 ring-slate-200">
      {Array.from({ length: 49 }).map((_, index) => {
        const filled = filledCells.has(index) || index % 5 === 0 || index % 11 === 0;
        return <span key={index} className={`rounded-sm ${filled ? "bg-slate-950" : "bg-slate-100"}`} />;
      })}
    </div>
  );
}

function PaymentModeDetails({
  paymentMode,
  selectedDoctor,
  selectedUpiApp,
  setSelectedUpiApp,
  showQr,
  setShowQr,
  upiId,
  setUpiId,
  selectedCardType,
  setSelectedCardType,
  cardDetails,
  setCardDetails,
}) {
  const fee = selectedDoctor?.consult_fee || 0;

  if (paymentMode === "Cash") {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Wallet size={24} /></div>
          <div>
            <p className="font-black text-emerald-800">Cash Payment</p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">Pay Rs. {fee} at the hospital counter during your visit. Your appointment will be booked now.</p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentMode === "UPI") {
    return (
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">UPI Payment</p>
        <p className="mt-1 text-sm font-medium text-slate-600">Choose a UPI app. QR is shown only after clicking Show QR.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {UPI_APPS.map((app) => {
            const active = selectedUpiApp === app.id;
            return (
              <button key={app.id} type="button" onClick={() => { setSelectedUpiApp(app.id); setShowQr(false); }} className={`rounded-2xl border p-3 text-left transition ${active ? "border-blue-500 bg-white shadow-lg shadow-blue-100" : "border-blue-100 bg-white/70 hover:bg-white"}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${app.color} text-sm font-black text-white`}>{app.short}</div>
                  <p className="font-black text-slate-800">{app.name}</p>
                </div>
              </button>
            );
          })}
        </div>
        {selectedUpiApp && (
          <div className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-blue-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-black text-slate-700">UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi" className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
                <p className="mt-2 text-xs font-semibold text-slate-500">Demo UPI ID: smarthealthcare@upi Â· Amount: Rs. {fee}</p>
              </div>
              <button type="button" onClick={() => setShowQr((value) => !value)} className="rounded-2xl bg-gradient-to-r from-blue-700 to-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg">{showQr ? "Hide QR" : "Show QR"}</button>
            </div>
            {showQr && (
              <div className="mt-5 flex flex-col items-center justify-center rounded-3xl bg-slate-50 p-5 text-center">
                <DemoQrCode />
                <p className="mt-4 text-sm font-black text-slate-800">Scan to Pay Rs. {fee}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">UPI ID: {upiId || "smarthealthcare@upi"}</p>
                <p className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">Demo QR only. No real payment will be processed.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (paymentMode === "Card") {
    return (
      <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600">Card Payment</p>
        <p className="mt-1 text-sm font-medium text-slate-600">Select card type and enter demo card details.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {CARD_TYPES.map((card) => {
            const active = selectedCardType === card.id;
            return (
              <button key={card.id} type="button" onClick={() => setSelectedCardType(card.id)} className={`rounded-2xl border p-3 text-left transition ${active ? "border-violet-500 bg-white shadow-lg shadow-violet-100" : "border-violet-100 bg-white/70 hover:bg-white"}`}>
                <div className="flex items-center gap-3"><span className={`h-7 w-10 rounded-lg ${card.accent}`} /><span className="font-black text-slate-800">{card.name}</span></div>
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 rounded-3xl bg-white p-4 ring-1 ring-violet-100">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">Card Holder Name</label>
            <input value={cardDetails.name} onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })} placeholder="Enter card holder name" className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">Card Number</label>
            <input value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, "").slice(0, 16) })} placeholder="1234 5678 9012 3456" className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Expiry</label>
              <input value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value.slice(0, 5) })} placeholder="MM/YY" className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">CVV</label>
              <input value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="123" className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500" />
            </div>
          </div>
          <p className="rounded-full bg-amber-100 px-3 py-2 text-center text-[11px] font-black text-amber-700">Demo card payment only. No real money will be charged.</p>
        </div>
      </div>
    );
  }

  return null;
}

function BookAppointmentView({
  doctors,
  selectedDoctorId,
  setSelectedDoctorId,
  selectedDoctor,
  appointmentDate,
  setAppointmentDate,
  slotTime,
  setSlotTime,
  paymentMode,
  setPaymentMode,
  booking,
  handleBookAppointment,
  loading,
}) {
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [upiId, setUpiId] = useState("smarthealthcare@upi");
  const [selectedCardType, setSelectedCardType] = useState("visa");
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  return (
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_440px]">
      <GlassCard className="h-[calc(100vh-180px)] min-h-[650px] overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#101735]">
              Available Doctors
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Select your preferred doctor for appointment booking.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-700">
            {doctors.length} Doctors
          </span>
        </div>

        {loading ? (
          <p className="mt-6 rounded-3xl border border-dashed border-blue-100 p-10 text-center text-base text-slate-500">
            Loading doctors...
          </p>
        ) : doctors.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-blue-100 p-10 text-center text-base text-slate-500">
            No doctors found for your branch.
          </p>
        ) : (
          <div className="mt-6 h-[calc(100%-96px)] overflow-y-auto pr-2">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {doctors.map((doctor) => {
                const active = selectedDoctorId === doctor.doctor_id;

                return (
                  <button
                    key={doctor.doctor_id}
                    type="button"
                    onClick={() => setSelectedDoctorId(doctor.doctor_id)}
                    className={`group rounded-[22px] border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
                      active
                        ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                        : "border-blue-100 bg-white/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <DoctorAvatar doctor={doctor} size="sm" />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-black text-[#101735]">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h3>
                        <p className="mt-1 text-sm font-black text-blue-700">
                          {doctor.department}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${doctorStatusClass(
                              doctor
                            )}`}
                          >
                            <DoctorStatusDot doctor={doctor} />
                          </span>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">
                            {doctorRating(doctor)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs font-semibold text-slate-500">
                      <p className="truncate">
                        <span className="font-black text-slate-700">ID:</span>{" "}
                        {doctor.doctor_id}
                      </p>
                      <p className="truncate">
                        <span className="font-black text-slate-700">Branch:</span>{" "}
                        {doctor.branch_id}
                      </p>
                      <p className="col-span-2 truncate">
                        {doctorExperience(doctor)}
                      </p>
                      <p className="col-span-2 font-black text-slate-700">
                        Fee: Rs. {doctor.consult_fee || 0}
                      </p>
                    </div>

                    {active && (
                      <div className="mt-3 rounded-2xl bg-gradient-to-r from-blue-700 to-emerald-500 px-4 py-2 text-center text-xs font-black text-white shadow-lg shadow-blue-100">
                        Selected Doctor
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="h-[calc(100vh-180px)] min-h-[650px] overflow-y-auto">
        <h2 className="text-2xl font-black text-[#101735]">Book Appointment</h2>

        <form onSubmit={handleBookAppointment} className="mt-7 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Selected Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={doctors.length === 0}
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500 disabled:bg-slate-100"
            >
              {doctors.length === 0 && <option value="">No doctors available</option>}
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  Dr. {doctor.first_name} {doctor.last_name} - {doctor.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                min={todayDate()}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Time Slot
              </label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTime(slot)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setShowQr(false);
              }}
              className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {selectedDoctor && (
            <div className="rounded-3xl bg-blue-50 p-5 text-base text-slate-700">
              <div className="mb-4 flex items-center gap-4">
                <DoctorAvatar doctor={selectedDoctor} />
                <div>
                  <p className="font-black">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedDoctor.department}
                  </p>
                </div>
              </div>

              <p><b>Doctor ID:</b> {selectedDoctor.doctor_id}</p>
              <p><b>Department:</b> {selectedDoctor.department}</p>
              <p><b>Experience:</b> {doctorExperience(selectedDoctor)}</p>
              <p><b>Rating:</b> {doctorRating(selectedDoctor)}</p>
              <p className="flex items-center gap-2">
                <b>Status:</b> <DoctorStatusDot doctor={selectedDoctor} />
              </p>
              <p><b>Branch:</b> {selectedDoctor.branch_id}</p>
              <p><b>Fee:</b> Rs. {selectedDoctor.consult_fee || 0}</p>
            </div>
          )}

          <PaymentModeDetails
            paymentMode={paymentMode}
            selectedDoctor={selectedDoctor}
            selectedUpiApp={selectedUpiApp}
            setSelectedUpiApp={setSelectedUpiApp}
            showQr={showQr}
            setShowQr={setShowQr}
            upiId={upiId}
            setUpiId={setUpiId}
            selectedCardType={selectedCardType}
            setSelectedCardType={setSelectedCardType}
            cardDetails={cardDetails}
            setCardDetails={setCardDetails}
          />

          <button
            type="submit"
            disabled={booking || doctors.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-emerald-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-100 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {booking ? "Booking..." : "Confirm Appointment"}
            <CalendarDays size={20} />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function AppointmentsView({ appointments, doctors }) {
  return <GlassCard><h2 className="text-2xl font-black text-[#101735]">My Appointments</h2><div className="mt-6 overflow-hidden rounded-3xl border border-blue-100"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-blue-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Appointment ID</th><th className="px-5 py-4">Doctor</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Slot</th><th className="px-5 py-4">Token</th><th className="px-5 py-4">Wait</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Fee</th></tr></thead><tbody className="divide-y divide-blue-50 bg-white">{appointments.map((a) => { const doctor = getDoctorForAppointment(doctors, a); return <tr key={a.appointment_id}><td className="px-5 py-4 font-black text-[#101735]">{a.appointment_id}</td><td className="px-5 py-4 font-semibold text-slate-600">{doctorTitle(doctor, a.doctor_id)}</td><td className="px-5 py-4 text-slate-600">{a.department}</td><td className="px-5 py-4 text-slate-600">{a.appointment_date}</td><td className="px-5 py-4 text-slate-600">{formatTime(a.slot_time)}</td><td className="px-5 py-4 text-lg font-black text-blue-700">{a.token_number || "--"}</td><td className="px-5 py-4 text-slate-600">{a.estimated_wait_minutes ?? "--"} mins</td><td className="px-5 py-4"><span className={`rounded-full px-4 py-2 text-xs font-black ${getStatusClass(a.status)}`}>{a.status}</span></td><td className="px-5 py-4 font-black text-slate-700">Rs. {a.consult_fee || 0}</td></tr>; })}</tbody></table></div></div></GlassCard>;
}

function AIHealthAssistantView() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [answer, setAnswer] = useState(
    "Hi, I am your SmartHealthcare AI Health Assistant. Ask me about symptoms, appointment preparation, diet guidance, or hospital visit support."
  );
  const [source, setSource] = useState("SmartHealthcare AI");
  const [disclaimer, setDisclaimer] = useState(
    "This is general health guidance only. Please consult a doctor for diagnosis or treatment."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    const direct =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("sh_token") ||
      localStorage.getItem("authToken") ||
      "";

    if (direct) return direct;

    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      return authUser.access_token || authUser.token || "";
    } catch {
      return "";
    }
  };

  const askAI = async () => {
    if (!question.trim()) {
      setError("Please type your question first.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Login token not found. Please logout, login again, and try AI Assistant.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/ai/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          context: context.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "AI request failed");
      }

      setAnswer(data.answer || "No AI response received.");
      setDisclaimer(data.disclaimer || "This is general health guidance only. Please consult a doctor.");
      setSource(data.source || "SmartHealthcare Demo AI");
    } catch (err) {
      setError(err.message || "AI Assistant is not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
      <GlassCard>
        <div className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-cyan-600 to-emerald-500 p-7 text-white shadow-xl">
          <Bot className="h-16 w-16 text-white" />

          <h2 className="mt-6 text-3xl font-black">
            AI Health Assistant
          </h2>

          <p className="mt-2 text-base font-medium leading-7 text-white/85">
            Get safe, simple, patient-friendly guidance before your hospital visit.
          </p>

          <div className="mt-6 rounded-3xl bg-white/15 p-5">
            <p className="text-sm font-black">Safety First</p>
            <p className="mt-2 text-sm font-medium leading-6 text-white/80">
              AI does not replace a doctor. For chest pain, breathing difficulty,
              severe bleeding, stroke symptoms, or loss of consciousness, visit emergency care immediately.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-[#101735]">Safe Guidance</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              No unsafe medicine prescription.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-black text-[#101735]">Appointment Support</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Helps you prepare before consultation.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-500">
              Ask SmartHealthcare AI
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#101735]">
              How can we help you today?
            </h2>
          </div>

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
            {source}
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            "I have fever and headache since yesterday. What should I do?",
            "I have stomach pain after food. What should I do?",
            "What should I prepare before my doctor appointment?",
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuestion(sample)}
              className="rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-xs font-bold leading-5 text-slate-600 hover:bg-blue-100"
            >
              {sample}
            </button>
          ))}
        </div>

        <label className="mt-6 block text-base font-black text-slate-700">
          Ask your question
        </label>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={5}
          placeholder="Example: I have fever and headache since yesterday. What should I do?"
          className="mt-4 w-full rounded-3xl border border-blue-100 p-5 text-base font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <label className="mt-5 block text-sm font-black text-slate-600">
          Extra context optional
        </label>

        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Example: Started yesterday, no doctor visit yet"
          className="mt-3 w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        {error && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={askAI}
          disabled={loading}
          className="mt-5 rounded-2xl bg-gradient-to-r from-blue-700 to-emerald-500 px-7 py-4 text-base font-black text-white shadow-lg shadow-blue-100 disabled:opacity-70"
        >
          {loading ? "AI is thinking..." : "Ask AI Assistant"}
        </button>

        <div className="mt-6 rounded-3xl bg-blue-50 p-6 text-base font-medium text-slate-700">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            AI Response
          </p>

          <div className="whitespace-pre-line leading-8">
            {answer}
          </div>

          <p className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
            {disclaimer}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
function MedicalSummaryView({ user, appointments }) {
  return <div className="grid gap-7 xl:grid-cols-3"><SummaryCard title="Blood Group" value="B+" icon={HeartPulse} /><SummaryCard title="Age" value="35 Years" icon={UserRound} /><SummaryCard title="Total Visits" value={appointments.length} icon={ClipboardList} /><GlassCard className="xl:col-span-3"><h2 className="text-2xl font-black text-[#101735]">Medical Summary</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><InfoRow label="Patient Name" value={user?.name || "-"} /><InfoRow label="Patient ID" value={user?.user_id || "-"} /><InfoRow label="City" value={user?.city || "-"} /><InfoRow label="Home Branch" value={user?.branch_id || user?.home_branch_id || "-"} /><InfoRow label="Allergies" value="No known allergies" /><InfoRow label="Last Visit Status" value={appointments[0]?.status || "No visits"} /></div></GlassCard></div>;
}

function SummaryCard({ title, value, icon: Icon }) {
  return <GlassCard><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Icon size={32} /></div><p className="mt-5 text-base font-black text-slate-400">{title}</p><p className="mt-2 text-3xl font-black text-[#101735]">{value}</p></GlassCard>;
}

function InfoRow({ label, value }) {
  return <div className="rounded-3xl border border-blue-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-lg font-black text-[#101735]">{value}</p></div>;
}

function BranchesView({ user }) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-500">
            SmartHealthcare Network
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#101735]">
            Hospital Branches
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Explore all Tamil Nadu SmartHealthcare hospitals with real branch images.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {BRANCHES.map((b) => {
          const active = b.id === user?.branch_id || b.city === user?.city;
          const branchImage = HOSPITAL_IMAGES[b.city] || "/hospitals/chennai_hospital.png";

          return (
            <div
              key={b.id}
              className={`group overflow-hidden rounded-[2rem] border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                active
                  ? "border-blue-400 bg-blue-50 shadow-blue-100"
                  : "border-blue-100 bg-white"
              }`}
            >
              <div className="relative h-52 overflow-hidden bg-blue-50">
                <img
                  src={branchImage}
                  alt={`SmartHealthcare Hospital ${b.city}`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />

                <div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-blue-700 shadow-lg backdrop-blur">
                  {b.id}
                </div>

                {active && (
                  <div className="absolute right-5 top-5 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg">
                    Your Branch
                  </div>
                )}

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.20em] text-white/75">
                    SmartHealthcare Hospital
                  </p>
                  <h3 className="mt-1 text-2xl font-black drop-shadow">
                    {b.city}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <MapPin size={17} className="text-blue-600" />
                  {b.address}
                </p>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Support
                    </p>
                    <a
                      href={`tel:${b.phone}`}
                      className="mt-1 block text-base font-black text-[#101735]"
                    >
                      {b.phone}
                    </a>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Hospital size={22} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function ProfileView({ user, appointments }) {
  return <div className="grid gap-7 xl:grid-cols-[0.7fr_1.3fr]"><GlassCard><div className="flex flex-col items-center text-center"><PatientAvatar profile={user} size="lg" /><h2 className="mt-6 text-3xl font-black text-[#101735]">{user?.name || "Patient"}</h2><p className="mt-1 text-base font-black text-blue-700">{user?.user_id}</p><p className="mt-1 text-base text-slate-500">{user?.city || "Chennai"}</p></div></GlassCard><GlassCard><h2 className="text-2xl font-black text-[#101735]">Patient Profile</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><InfoRow label="Patient ID" value={user?.user_id || "-"} /><InfoRow label="Name" value={user?.name || "-"} /><InfoRow label="Role" value={user?.role || "PATIENT"} /><InfoRow label="City" value={user?.city || "-"} /><InfoRow label="Branch ID" value={user?.branch_id || user?.home_branch_id || "-"} /><InfoRow label="Total Appointments" value={appointments.length} /></div></GlassCard></div>;
}

const CITY_ADMINS = [
  { admin_id: "SMHCC-1", name: "Arjun Narayanan", city: "Chennai", branch_id: "BR001", gender: "Male", phone: "9841012345", status: "Active", last_active: "Active 4 min ago" },
  { admin_id: "SMHTR-1", name: "Meena Subramanian", city: "Trichy", branch_id: "BR002", gender: "Female", phone: "9842012345", status: "Active", last_active: "Active 7 min ago" },
  { admin_id: "SMHMD-1", name: "Kavin Selvam", city: "Madurai", branch_id: "BR003", gender: "Male", phone: "9843012345", status: "Inactive", last_active: "Inactive 1 hr ago" },
  { admin_id: "SMHCB-1", name: "Priya Natarajan", city: "Coimbatore", branch_id: "BR004", gender: "Female", phone: "9844012345", status: "Active", last_active: "Active 2 min ago" },
  { admin_id: "SMHTJ-1", name: "Dinesh Rajan", city: "Thanjavur", branch_id: "BR005", gender: "Male", phone: "9845012345", status: "Active", last_active: "Active 10 min ago" },
  { admin_id: "SMHSL-1", name: "Lavanya Krishnan", city: "Salem", branch_id: "BR006", gender: "Female", phone: "9846012345", status: "Inactive", last_active: "Inactive 2 hr ago" },
  { admin_id: "SMHTV-1", name: "Vignesh Murugan", city: "Tirunelveli", branch_id: "BR007", gender: "Male", phone: "9847012345", status: "Active", last_active: "Active 5 min ago" },
  { admin_id: "SMHER-1", name: "Divya Shanmugam", city: "Erode", branch_id: "BR008", gender: "Female", phone: "9848012345", status: "Active", last_active: "Active 8 min ago" },
  { admin_id: "SMHVL-1", name: "Raghul Venkatesh", city: "Vellore", branch_id: "BR009", gender: "Male", phone: "9849012345", status: "Inactive", last_active: "Inactive 35 min ago" },
  { admin_id: "SMHHS-1", name: "Sneha Balaji", city: "Hosur", branch_id: "BR010", gender: "Female", phone: "9850012345", status: "Active", last_active: "Active 3 min ago" },
];

function normalizeAdminRole(role) {
  const value = String(role || "").toUpperCase();
  if (value.includes("SUPER")) return "SUPER_ADMIN";
  if (value.includes("CITY")) return "CITY_ADMIN";
  if (value.includes("STATE")) return "STATE_ADMIN";
  return value || "ADMIN";
}

function getAdminBranch(profile) {
  return (
    BRANCHES.find((branch) => branch.id === profile?.branch_id) ||
    BRANCHES.find((branch) => branch.city === profile?.city) ||
    BRANCHES[0]
  );
}

function getAdminScope(profile, mode) {
  const role = normalizeAdminRole(profile?.role);
  if (mode === "super" || role === "SUPER_ADMIN") return "Tamil Nadu";
  return profile?.city || getAdminBranch(profile)?.city || "City";
}

function getAdminAvatar(profile, mode) {
  const role = normalizeAdminRole(profile?.role);
  if (mode === "super" || role === "SUPER_ADMIN") {
    return "/avatars/admins/super_admin.png";
  }

  const adminRecord = CITY_ADMINS.find(
    (admin) =>
      admin.admin_id === profile?.user_id ||
      admin.admin_id === profile?.admin_id ||
      admin.city === profile?.city
  );

  const gender = String(adminRecord?.gender || profile?.gender || "Male").toLowerCase();

  return gender === "female"
    ? "/avatars/admins/admin_female.png"
    : "/avatars/admins/admin_male.png";
}

function isTodayAppointment(appointment) {
  return appointment?.appointment_date === todayDate();
}

function adminName(profile, mode) {
  if (profile?.name) return profile.name;
  if (mode === "super") return "Pravin Kumaar K";

  const record = CITY_ADMINS.find(
    (admin) =>
      admin.admin_id === profile?.user_id ||
      admin.admin_id === profile?.admin_id ||
      admin.city === profile?.city
  );

  return record?.name || profile?.user_id || "Admin";
}

function filterCityData(items, profile) {
  const branch = getAdminBranch(profile);
  return items.filter(
    (item) =>
      item.branch_id === branch?.id ||
      item.branch_id === profile?.branch_id ||
      item.city === profile?.city
  );
}

export function CityAdminDashboard() {
  return <AdminDashboard mode="city" />;
}

export function StateAdminDashboard() {
  return <AdminDashboard mode="super" />;
}

export function SuperAdminDashboard() {
  return <AdminDashboard mode="super" />;
}

function AdminDashboard({ mode = "city" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const role = normalizeAdminRole(profile?.role);
  const isSuper = mode === "super" || role === "SUPER_ADMIN";
  const branch = getAdminBranch(profile);
  const scope = getAdminScope(profile, mode);
  const hospitalImage = isSuper
    ? "/hospitals/chennai_hospital.png"
    : HOSPITAL_IMAGES[branch?.city] || "/hospitals/chennai_hospital.png";

  const visibleDoctors = isSuper ? doctors : filterCityData(doctors, profile);
  const visibleAppointments = isSuper
    ? appointments
    : filterCityData(appointments, profile);

  const todayAppointments = visibleAppointments.filter(isTodayAppointment);
  const activeDoctors = visibleDoctors.filter(isDoctorActive);

  const stats = [
    {
      label: isSuper ? "Total Branches" : "Branch ID",
      value: isSuper ? BRANCHES.length : branch?.id || "-",
      icon: Building2,
      tone: isSuper ? "from-amber-500 to-yellow-500" : "from-emerald-500 to-teal-500",
      note: isSuper ? "Tamil Nadu network" : branch?.city || "Assigned branch",
    },
    {
      label: "Doctors",
      value: visibleDoctors.length,
      icon: Stethoscope,
      tone: isSuper ? "from-blue-600 to-cyan-500" : "from-green-600 to-emerald-500",
      note: `${activeDoctors.length} active now`,
    },
    {
      label: "Appointments",
      value: visibleAppointments.length,
      icon: CalendarCheck,
      tone: isSuper ? "from-violet-500 to-indigo-500" : "from-blue-500 to-cyan-500",
      note: `${todayAppointments.length} today`,
    },
    {
      label: isSuper ? "City Admins" : "Support",
      value: isSuper ? CITY_ADMINS.length : branch?.phone || "-",
      icon: ShieldCheck,
      tone: isSuper ? "from-orange-500 to-amber-500" : "from-lime-500 to-green-500",
      note: isSuper ? "Monitoring enabled" : `${branch?.city || "City"} help desk`,
    },
  ];

  const menu = isSuper
    ? [
        { id: "overview", label: "TN Overview", icon: Home },
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "admins", label: "City Admins", icon: ShieldCheck },
        { id: "branches", label: "All Branches", icon: Building2 },
        { id: "appointments", label: "Appointments", icon: CalendarDays },
        { id: "ai", label: "AI Insight", icon: Sparkles },
      ]
    : [
        { id: "overview", label: "City Overview", icon: Home },
        { id: "doctors", label: "Doctors", icon: Stethoscope },
        { id: "appointments", label: "Appointments", icon: CalendarDays },
        { id: "branch", label: "Branch Details", icon: Hospital },
        { id: "ai", label: "AI Insight", icon: Sparkles },
      ];

  const loadAdminData = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const profileRes = await getCurrentUser();
      const latestProfile = { ...user, ...profileRes.data };
      setProfile(latestProfile);

      const latestRole = normalizeAdminRole(latestProfile?.role);
      const superAccess = mode === "super" || latestRole === "SUPER_ADMIN";
      const latestBranch = getAdminBranch(latestProfile);

      const doctorParams = { active_only: false };
      const appointmentParams = {};

      if (!superAccess) {
        if (latestProfile?.branch_id || latestBranch?.id) {
          doctorParams.branch_id = latestProfile?.branch_id || latestBranch.id;
          appointmentParams.branch_id = latestProfile?.branch_id || latestBranch.id;
        }

        if (latestProfile?.city || latestBranch?.city) {
          doctorParams.city = latestProfile?.city || latestBranch.city;
          appointmentParams.city = latestProfile?.city || latestBranch.city;
        }
      }

      const [doctorRes, appointmentRes] = await Promise.allSettled([
        getDoctors(doctorParams),
        getAdminAppointments(appointmentParams),
      ]);

      if (doctorRes.status === "fulfilled") {
        setDoctors(doctorRes.value.data || []);
      } else {
        setDoctors([]);
      }

      if (appointmentRes.status === "fulfilled") {
        setAppointments(appointmentRes.value.data || []);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      setLoadError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard data. Check backend and login token."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isSuper ? "bg-amber-50" : "bg-emerald-50"
      }`}
    >
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hospitalImage})` }}
      />
      <div
        className={`pointer-events-none fixed inset-0 ${
          isSuper
            ? "bg-gradient-to-br from-amber-50/96 via-white/90 to-yellow-100/84"
            : "bg-gradient-to-br from-emerald-50/96 via-white/90 to-green-100/84"
        }`}
      />
      <div className="pointer-events-none fixed inset-0 backdrop-blur-[1.2px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`hidden w-[300px] shrink-0 p-5 lg:block ${
            isSuper ? "text-amber-950" : "text-emerald-950"
          }`}
        >
          <div
            className={`sticky top-5 flex h-[calc(100vh-40px)] flex-col rounded-[2rem] p-5 shadow-2xl ${
              isSuper
                ? "bg-gradient-to-b from-[#b7791f] via-[#92400e] to-[#451a03] text-white"
                : "bg-gradient-to-b from-[#0f8f61] via-[#047857] to-[#064e3b] text-white"
            }`}
          >
            <Logo
              size="sm"
              variant="sidebar"
              city={scope}
              subtitle={isSuper ? "Super Admin Portal" : "City Admin Portal"}
            />

            <div className="mt-6 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="flex items-center gap-3">
                <img
                  src={getAdminAvatar(profile, mode)}
                  alt={adminName(profile, mode)}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/40"
                  onError={(event) => {
                    event.currentTarget.src = isSuper
                      ? "/avatars/admins/super_admin.png"
                      : "/avatars/admins/admin_male.png";
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {adminName(profile, mode)}
                  </p>
                  <p className="truncate text-xs text-white/70">
                    {profile?.user_id || profile?.admin_id || "Admin"}
                  </p>
                  <p className="mt-1 inline-flex rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                    Active
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
              {menu.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                      active
                        ? "bg-white text-slate-950 shadow-lg"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {active && (
                      <span
                        className={`ml-auto h-2 w-2 rounded-full ${
                          isSuper ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/80 ring-1 ring-white/15 hover:bg-white/15"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8">
          <AdminHeader
            profile={profile}
            scope={scope}
            isSuper={isSuper}
            mode={mode}
            handleLogout={handleLogout}
          />

          {loadError && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}

          {loading && (
            <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-sm font-bold text-slate-500 shadow-sm">
              Loading admin dashboard data...
            </div>
          )}

          <div className="mt-6 space-y-6">
            {activeView === "overview" && (
              <AdminOverview
                isSuper={isSuper}
                stats={stats}
                scope={scope}
                branch={branch}
                profile={profile}
                visibleDoctors={visibleDoctors}
                visibleAppointments={visibleAppointments}
                todayAppointments={todayAppointments}
                hospitalImage={hospitalImage}
              />
            )}

            {activeView === "analytics" && isSuper && (
              <SuperAdminAnalyticsView
                doctors={doctors}
                appointments={appointments}
              />
            )}

            {activeView === "admins" && isSuper && <CityAdminsPanel />}
            {activeView === "branches" && isSuper && (
              <AdminBranchesPanel
                doctors={doctors}
                appointments={appointments}
              />
            )}

            {activeView === "doctors" && !isSuper && (
              <AdminDoctorsPanel doctors={visibleDoctors} />
            )}

            {activeView === "appointments" && (
              <AdminAppointmentsPanel
                appointments={visibleAppointments}
                doctors={visibleDoctors}
              />
            )}

            {activeView === "branch" && !isSuper && (
              <CityBranchPanel branch={branch} hospitalImage={hospitalImage} />
            )}

            {activeView === "ai" && (
              <AdminAIInsightView
                isSuper={isSuper}
                profile={profile}
                scope={scope}
                visibleDoctors={visibleDoctors}
                visibleAppointments={visibleAppointments}
                todayAppointments={todayAppointments}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SuperAdminAnalyticsView({ doctors = [], appointments = [] }) {
  const totalRevenue = appointments.reduce(
    (sum, item) => sum + Number(item.consult_fee || 0),
    0
  );

  const todayItems = appointments.filter(isTodayAppointment);

  const activeDoctors = doctors.filter((doctor) => {
    const value = doctor.active ?? doctor.is_active ?? doctor.status;
    if (typeof value === "boolean") return value;
    return String(value || "").toLowerCase() !== "inactive";
  });

  const branchAnalytics = BRANCHES.map((branch) => {
    const branchAppointments = appointments.filter((item) => {
      const itemBranch = String(item.branch_id || "").trim();
      const itemCity = String(item.city || "").trim();
      return itemBranch === branch.id || itemCity === branch.city;
    });

    const branchDoctors = doctors.filter((doctor) => {
      const doctorBranch = String(doctor.branch_id || "").trim();
      const doctorCity = String(doctor.city || "").trim();
      return doctorBranch === branch.id || doctorCity === branch.city;
    });

    const revenue = branchAppointments.reduce(
      (sum, item) => sum + Number(item.consult_fee || 0),
      0
    );

    return {
      ...branch,
      appointments: branchAppointments.length,
      doctors: branchDoctors.length,
      revenue,
    };
  });

  const topBranch =
    [...branchAnalytics].sort((a, b) => b.appointments - a.appointments)[0] ||
    BRANCHES[0];

  const departmentMap = appointments.reduce((acc, item) => {
    const dept = item.department || "General";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departmentDemand = Object.entries(departmentMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const highDemandDepartment = departmentDemand[0]?.name || "General";

  const paymentMap = appointments.reduce((acc, item) => {
    const mode = item.payment_mode || "Cash";
    acc[mode] = acc[mode] || { count: 0, revenue: 0 };
    acc[mode].count += 1;
    acc[mode].revenue += Number(item.consult_fee || 0);
    return acc;
  }, {});

  const paymentSummary = Object.entries(paymentMap).map(([name, value]) => ({
    name,
    count: value.count,
    revenue: value.revenue,
  }));

  const doctorWorkload = doctors
    .map((doctor) => {
      const count = appointments.filter(
        (item) => String(item.doctor_id) === String(doctor.doctor_id)
      ).length;

      return {
        doctor,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const cityAdminActive = CITY_ADMINS.filter(
    (admin) => admin.status === "Active"
  ).length;

  const maxBranchAppointments = Math.max(
    ...branchAnalytics.map((item) => item.appointments),
    1
  );

  const maxDepartmentAppointments = Math.max(
    ...departmentDemand.map((item) => item.count),
    1
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
              Super Admin Analytics
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#101735]">
              Tamil Nadu Command Center
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Leadership-level analytics for hospital performance, branch workload,
              doctor utilization, appointment demand, and revenue tracking.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white shadow-lg shadow-amber-100">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
              Top Branch
            </p>
            <p className="mt-1 text-2xl font-black">{topBranch.city}</p>
            <p className="text-sm font-semibold text-white/80">
              {topBranch.appointments} appointments
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsKpiCard
          title="Total Appointments"
          value={appointments.length}
          note={`${todayItems.length} today`}
          icon={CalendarCheck}
          tone="amber"
        />

        <AnalyticsKpiCard
          title="Active Doctors"
          value={activeDoctors.length}
          note={`${doctors.length} total doctors`}
          icon={Stethoscope}
          tone="blue"
        />

        <AnalyticsKpiCard
          title="Revenue"
          value={`Rs. ${totalRevenue.toLocaleString("en-IN")}`}
          note="Consultation fee summary"
          icon={Wallet}
          tone="green"
        />

        <AnalyticsKpiCard
          title="City Admins Active"
          value={`${cityAdminActive}/${CITY_ADMINS.length}`}
          note="Live branch monitoring"
          icon={ShieldCheck}
          tone="orange"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Branch Performance
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#101735]">
                Branch-wise Appointments
              </h3>
            </div>

            <Building2 className="h-11 w-11 text-amber-600" />
          </div>

          <div className="mt-6 space-y-4">
            {branchAnalytics.map((item) => (
              <AnalyticsBarRow
                key={item.id}
                label={item.city}
                value={item.appointments}
                max={maxBranchAppointments}
                subText={`${item.doctors} doctors · Rs. ${item.revenue.toLocaleString("en-IN")}`}
                tone="amber"
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Department Demand
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#101735]">
              High-demand Departments
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            {departmentDemand.length === 0 ? (
              <p className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                No appointment department data available yet.
              </p>
            ) : (
              departmentDemand.map((item) => (
                <AnalyticsBarRow
                  key={item.name}
                  label={item.name}
                  value={item.count}
                  max={maxDepartmentAppointments}
                  subText="appointments"
                  tone="blue"
                />
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
            Payment Analytics
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#101735]">
            Revenue by Payment Mode
          </h3>

          <div className="mt-6 space-y-3">
            {paymentSummary.length === 0 ? (
              <p className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                No payment data available yet.
              </p>
            ) : (
              paymentSummary.map((item) => (
                <div
                  key={item.name}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-[#101735]">{item.name}</p>
                    <p className="font-black text-emerald-700">
                      Rs. {item.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {item.count} appointments
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">
            Doctor Workload
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#101735]">
            Most Assigned Doctors
          </h3>

          <div className="mt-6 space-y-3">
            {doctorWorkload.length === 0 ? (
              <p className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                No doctor workload data available yet.
              </p>
            ) : (
              doctorWorkload.map(({ doctor, count }) => (
                <div
                  key={doctor.doctor_id}
                  className="flex items-center gap-3 rounded-3xl border border-violet-100 bg-violet-50/60 p-4"
                >
                  <DoctorAvatar doctor={doctor} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-[#101735]">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {doctor.department}
                    </p>
                  </div>
                  <p className="text-xl font-black text-violet-700">
                    {count}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-600">
            Executive Summary
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#101735]">
            CEO / HR View
          </h3>

          <div className="mt-6 space-y-4">
            <AnalyticsMiniList
              title="Top Performing Branch"
              value={topBranch.city}
              note={`${topBranch.appointments} appointments`}
            />

            <AnalyticsMiniList
              title="High Demand Department"
              value={highDemandDepartment}
              note="Based on appointment count"
            />

            <AnalyticsMiniList
              title="Network Coverage"
              value={`${BRANCHES.length} Branches`}
              note="Across Tamil Nadu"
            />

            <AnalyticsMiniList
              title="Operational Signal"
              value={todayItems.length > 0 ? "Active Today" : "Normal Monitoring"}
              note="Ready for executive snapshot"
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function AnalyticsKpiCard({ title, value, note, icon: Icon, tone }) {
  const styles = {
    amber: "from-amber-500 to-orange-500 text-amber-700 bg-amber-50",
    blue: "from-blue-600 to-cyan-500 text-blue-700 bg-blue-50",
    green: "from-emerald-600 to-teal-500 text-emerald-700 bg-emerald-50",
    orange: "from-orange-500 to-red-500 text-orange-700 bg-orange-50",
  };

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${
          styles[tone].split(" text-")[0]
        } text-white shadow-lg`}
      >
        <Icon size={27} />
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-[#101735]">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{note}</p>
    </div>
  );
}

function AnalyticsBarRow({ label, value, max, subText, tone = "amber" }) {
  const width = Math.max(6, Math.round((Number(value || 0) / max) * 100));
  const barColor =
    tone === "blue"
      ? "from-blue-600 to-cyan-500"
      : "from-amber-500 to-orange-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#101735]">{label}</p>
          <p className="text-xs font-bold text-slate-500">{subText}</p>
        </div>
        <p className="text-lg font-black text-slate-800">{value}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function AnalyticsMiniList({ title, value, note }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-xl font-black text-[#101735]">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{note}</p>
    </div>
  );
}

function AdminAIInsightView({
  isSuper,
  profile,
  scope,
  visibleDoctors,
  visibleAppointments,
  todayAppointments,
}) {
  const [answer, setAnswer] = useState(
    isSuper
      ? "Click Generate AI Insight to view Tamil Nadu network-level operational intelligence."
      : "Click Generate AI Insight to view branch-level operational guidance."
  );
  const [source, setSource] = useState("SmartHealthcare AI");
  const [disclaimer, setDisclaimer] = useState(
    "AI insight is for decision support. Verify with actual hospital data before action."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    const direct =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("sh_token") ||
      localStorage.getItem("authToken") ||
      "";

    if (direct) return direct;

    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      return authUser.access_token || authUser.token || "";
    } catch {
      return "";
    }
  };

  const activeDoctors = visibleDoctors.filter((doctor) => {
    const value = doctor.active ?? doctor.is_active ?? doctor.status;
    if (typeof value === "boolean") return value;
    return String(value || "").toLowerCase() !== "inactive";
  });

  const pendingAppointments = visibleAppointments.filter((item) =>
    ["Booked", "Scheduled", "Pending"].includes(item.status)
  );

  const generateInsight = async () => {
    const token = getToken();

    if (!token) {
      setError("Admin login token not found. Please logout, login again, and try AI Insight.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/ai/admin-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Admin AI request failed");
      }

      setAnswer(data.answer || "No AI insight received.");
      setDisclaimer(
        data.disclaimer ||
          "This is an AI-generated operational insight. Verify with hospital data before action."
      );
      setSource(data.source || "SmartHealthcare Demo AI");
    } catch (err) {
      setError(err.message || "Admin AI Insight is not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <GlassCard>
        <div
          className={`rounded-[2rem] p-7 text-white shadow-xl ${
            isSuper
              ? "bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-500"
              : "bg-gradient-to-br from-emerald-700 via-green-600 to-teal-500"
          }`}
        >
          <Sparkles size={48} />

          <h2 className="mt-6 text-3xl font-black">
            {isSuper ? "Executive AI Insight" : "City Admin AI Insight"}
          </h2>

          <p className="mt-3 text-base font-medium leading-7 text-white/85">
            {isSuper
              ? "Leadership-level operational insight for CEO, HR, and Super Admin review."
              : "Branch-level operational guidance for smoother patient service."}
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Doctors
            </p>
            <p className="mt-1 text-3xl font-black text-[#101735]">
              {visibleDoctors.length}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {activeDoctors.length} active doctors
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Appointments
            </p>
            <p className="mt-1 text-3xl font-black text-[#101735]">
              {visibleAppointments.length}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {todayAppointments.length} today
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Pending Queue
            </p>
            <p className="mt-1 text-3xl font-black text-[#101735]">
              {pendingAppointments.length}
            </p>
            <p className="text-xs font-bold text-slate-500">
              Needs monitoring
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isSuper ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {isSuper ? "Tamil Nadu Command Intelligence" : `${scope} Branch Intelligence`}
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#101735]">
              AI Operations Summary
            </h2>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-black ${
              isSuper
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {source}
          </span>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={generateInsight}
          disabled={loading}
          className={`mt-6 rounded-2xl px-7 py-4 text-base font-black text-white shadow-lg disabled:opacity-70 ${
            isSuper
              ? "bg-gradient-to-r from-amber-600 to-orange-600"
              : "bg-gradient-to-r from-emerald-700 to-teal-500"
          }`}
        >
          {loading ? "Generating insight..." : "Generate AI Insight"}
        </button>

        <div
          className={`mt-6 rounded-[2rem] border p-6 ${
            isSuper
              ? "border-amber-100 bg-gradient-to-br from-amber-50 to-white"
              : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
          }`}
        >
          <p
            className={`text-sm font-black uppercase tracking-[0.18em] ${
              isSuper ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            AI Insight
          </p>

          <div className="mt-4 whitespace-pre-line text-base font-semibold leading-8 text-slate-700">
            {answer}
          </div>

          <p className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
            {disclaimer}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function AdminHeader({ profile, scope, isSuper, mode, handleLogout }) {
  return (
    <header className="rounded-[2rem] border border-white/75 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.25em] ${
              isSuper ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            SmartHealthcare Hospital
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
            {isSuper ? "Tamil Nadu Super Admin Portal" : `${scope} City Admin Portal`}
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Welcome, {adminName(profile, mode)} Â· {profile?.user_id || profile?.admin_id || "Admin"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-100 sm:block">
            <MapPin className="mr-2 inline h-4 w-4" />
            {scope}
          </div>

          <img
            src={getAdminAvatar(profile, mode)}
            alt={adminName(profile, mode)}
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow"
            onError={(event) => {
              event.currentTarget.src = isSuper
                ? "/avatars/admins/super_admin.png"
                : "/avatars/admins/admin_male.png";
            }}
          />

          <button
            onClick={handleLogout}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminOverview({
  isSuper,
  stats,
  scope,
  branch,
  profile,
  visibleDoctors,
  visibleAppointments,
  todayAppointments,
  hospitalImage,
}) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div
          className={`h-full overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl ${
            isSuper
              ? "bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-700"
              : "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
                {isSuper ? "State Control Center" : "Branch Control Center"}
              </p>
              <h2 className="mt-2 text-3xl font-black">
                {isSuper ? "Tamil Nadu Network Overview" : `${scope} Hospital Overview`}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-white/80">
                {isSuper
                  ? "Monitor all SmartHealthcare branches, appointments, doctors, and city admins across Tamil Nadu."
                  : `Manage doctors, patients, appointments, and hospital activity for ${branch?.city}.`}
              </p>
            </div>

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              {isSuper ? <ShieldCheck size={28} /> : <Hospital size={28} />}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MiniMetric label="Today Appointments" value={todayAppointments.length} />
            <MiniMetric label="Active Doctors" value={visibleDoctors.filter(isDoctorActive).length} />
            <MiniMetric label="Total Records" value={visibleAppointments.length + visibleDoctors.length} />
          </div>
        </div>

        <div className="h-full overflow-hidden rounded-[2rem] border border-white/75 bg-white shadow-xl">
          <div className="relative h-52">
            <img
              src={hospitalImage}
              alt="SmartHealthcare Hospital"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">
                SmartHealthcare Hospital
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {isSuper ? "Tamil Nadu" : branch?.city}
              </h3>
            </div>
          </div>

          <div className="p-5">
            <InfoRow
              label={isSuper ? "Scope" : "Branch"}
              value={isSuper ? "All Tamil Nadu Branches" : `${branch?.id} Â· ${branch?.address}`}
            />
          </div>
        </div>
      </div>

      {isSuper ? (
        <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <CityAdminsPanel compact />
          <AdminBranchesPanel doctors={visibleDoctors} appointments={visibleAppointments} compact />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <AdminDoctorsPanel doctors={visibleDoctors} compact />
          <AdminAppointmentsPanel appointments={visibleAppointments} doctors={visibleDoctors} compact />
        </div>
      )}
    </>
  );
}

function AdminStatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-[2rem] border border-white/75 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {stat.label}
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {stat.value}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {stat.note}
          </p>
        </div>

        <div
          className={`grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-white shadow-lg`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
      <p className="text-xs font-bold uppercase tracking-wide text-white/70">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function CityAdminsPanel({ compact = false }) {
  const visibleAdmins = compact ? CITY_ADMINS.slice(0, 5) : CITY_ADMINS;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
            Monitoring
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            City Admins
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-700">
          {CITY_ADMINS.length} Admins
        </span>
      </div>

      <div className={`${compact ? "mt-5 space-y-3" : "mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-2"}`}>
        {visibleAdmins.map((admin) => {
          const active = admin.status === "Active";
          const avatar =
            admin.gender === "Female"
              ? "/avatars/admins/admin_female.png"
              : "/avatars/admins/admin_male.png";

          return (
            <div
              key={admin.admin_id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <img
                src={avatar}
                alt={admin.name}
                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-100"
                onError={(event) => {
                  event.currentTarget.src = "/avatars/admins/admin_male.png";
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-slate-950">
                  {admin.name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {admin.city} Â· {admin.admin_id}
                </p>
                <a
                  href={`tel:${admin.phone}`}
                  className="mt-1 block text-xs font-black text-blue-700 hover:underline"
                >
                  Emergency: {admin.phone}
                </a>
              </div>

              <div className="text-right">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {admin.status}
                </span>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {admin.last_active}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function AdminBranchesPanel({ doctors, appointments, compact = false }) {
  const visibleBranches = compact ? BRANCHES.slice(0, 5) : BRANCHES;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
            Network
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Hospital Branches
          </h2>
        </div>
      </div>

      <div className={`${compact ? "mt-5 grid gap-4 md:grid-cols-2" : "mt-5 grid max-h-[650px] gap-4 overflow-y-auto pr-2 md:grid-cols-2"}`}>
        {visibleBranches.map((branch) => {
          const branchDoctors = doctors.filter((doctor) => doctor.branch_id === branch.id);
          const branchAppointments = appointments.filter(
            (appointment) => appointment.branch_id === branch.id
          );

          return (
            <div
              key={branch.id}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            >
              <div className="relative h-36">
                <img
                  src={HOSPITAL_IMAGES[branch.city]}
                  alt={`SmartHealthcare Hospital ${branch.city}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-xs font-bold text-white/75">{branch.id}</p>
                  <h3 className="text-xl font-black">{branch.city}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-400">Doctors</p>
                  <p className="text-xl font-black text-slate-950">{branchDoctors.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-400">Appointments</p>
                  <p className="text-xl font-black text-slate-950">{branchAppointments.length}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function AdminDoctorsPanel({ doctors, compact = false }) {
  const visibleDoctors = compact ? doctors.slice(0, 5) : doctors;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Medical Team
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Doctor Availability
          </h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
          {doctors.filter(isDoctorActive).length} Active
        </span>
      </div>

      <div className={`${compact ? "mt-5 space-y-3" : "mt-5 max-h-[650px] space-y-3 overflow-y-auto pr-2"}`}>
        {visibleDoctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
            No doctors loaded for this admin scope.
          </div>
        ) : (
          visibleDoctors.map((doctor) => (
            <div
              key={doctor.doctor_id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <DoctorAvatar doctor={doctor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-slate-950">
                  Dr. {doctor.first_name} {doctor.last_name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {doctor.department} Â· {doctor.doctor_id}
                </p>
              </div>

              <div className="text-right">
                <DoctorStatusDot doctor={doctor} />
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {doctorExperience(doctor)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

function AdminAppointmentsPanel({ appointments, doctors, compact = false }) {
  const visibleAppointments = compact ? appointments.slice(0, 6) : appointments;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Schedule
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Appointment Monitoring
          </h2>
        </div>
        <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-700">
          {appointments.length} Records
        </span>
      </div>

      <div className={`${compact ? "mt-5 overflow-hidden rounded-3xl border border-slate-100" : "mt-5 max-h-[650px] overflow-hidden rounded-3xl border border-slate-100"}`}>
        <div className="h-full overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Appointment</th>
                <th className="px-5 py-4">Doctor</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Token</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                    No appointment records loaded.
                  </td>
                </tr>
              ) : (
                visibleAppointments.map((appointment) => {
                  const doctor = getDoctorForAppointment(doctors, appointment);

                  return (
                    <tr key={appointment.appointment_id}>
                      <td className="px-5 py-4 font-black text-slate-950">
                        {appointment.appointment_id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        {doctorTitle(doctor, appointment.doctor_id)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {appointment.department}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(appointment.appointment_date)}
                      </td>
                      <td className="px-5 py-4 text-lg font-black text-blue-700">
                        {appointment.token_number || "--"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}

function CityBranchPanel({ branch, hospitalImage }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-[2rem] border border-white/75 bg-white shadow-xl">
        <img
          src={hospitalImage}
          alt={`SmartHealthcare Hospital ${branch?.city}`}
          className="h-72 w-full object-cover"
        />
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Assigned Hospital
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            SmartHealthcare Hospital
          </h2>
          <p className="mt-1 text-xl font-black text-slate-700">
            {branch?.city}
          </p>
        </div>
      </div>

      <GlassCard>
        <h2 className="text-2xl font-black text-slate-950">Branch Details</h2>
        <div className="mt-6 grid gap-4">
          <InfoRow label="Branch ID" value={branch?.id || "-"} />
          <InfoRow label="City" value={branch?.city || "-"} />
          <InfoRow label="Address" value={branch?.address || "-"} />
          <InfoRow label="Support Number" value={branch?.phone || "-"} />
        </div>
      </GlassCard>
    </div>
  );
}




