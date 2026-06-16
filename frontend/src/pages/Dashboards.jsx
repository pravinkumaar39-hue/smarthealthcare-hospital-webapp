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

import { useAuth } from "../context/AuthContext";
import {
  getCurrentUser,
  getDoctors,
  getMyAppointments,
  bookAppointment,
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

  return `${Number(rating).toFixed(2)} ★`;
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
    <div className={`rounded-[28px] border border-white/75 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,73,150,0.10)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function PatientLayout({ children, activeView, setActiveView, profile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayUser = profile || user;

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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fbff] via-[#eff6ff] to-[#f7fbff] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 p-4 lg:flex">
          <div className="relative flex w-full flex-col overflow-hidden rounded-[30px] bg-gradient-to-b from-[#0d66e8] via-[#0648b8] to-[#052d78] p-5 text-white shadow-2xl">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(600px_220px_at_0%_0%,rgba(96,165,250,0.55),transparent_60%)]" />
            <div className="relative mb-8 flex items-center gap-3 px-1">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-black leading-tight">SmartHealthcare</p>
                <p className="text-sm text-white/70">Patient Portal</p>
              </div>
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
                    <p className="truncate text-xs text-white/70">Contact Support</p>
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
                  <button className="rounded-2xl border border-blue-100 bg-white/80 p-2"><Menu size={20} /></button>
                  <p className="font-black text-blue-700">SmartHealthcare</p>
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111936] lg:mt-0 lg:text-4xl">
                  Good Evening, <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">{displayUser?.name || "Patient"}</span>
                </h1>
                <p className="mt-2 text-sm text-slate-500 lg:text-base">Take care of your health. We are here to help you stay on top of every visit.</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button className="hidden items-center gap-2 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-sm font-bold shadow-sm backdrop-blur md:flex">
                  <MapPin className="h-4 w-4 text-blue-700" /> {displayUser?.city || "Chennai"} <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                <button className="relative grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white/80 shadow-sm backdrop-blur">
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
      const doctorParams = { active_only: false };
      if (profileData?.branch_id) doctorParams.branch_id = profileData.branch_id;
      else if (profileData?.city) doctorParams.city = profileData.city;
      const [doctorRes, appointmentRes] = await Promise.all([getDoctors(doctorParams), getMyAppointments()]);
      const doctorData = doctorRes.data || [];
      const appointmentData = appointmentRes.data || [];
      setDoctors(doctorData);
      setAppointments(appointmentData);
      if (doctorData.length > 0) {
        setSelectedDoctorId((currentValue) => doctorData.some((doctor) => doctor.doctor_id === currentValue) ? currentValue : doctorData[0].doctor_id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load dashboard data. Please login again.");
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
        <NotificationsCard upcomingAppointment={upcomingAppointment} />
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-[0_24px_60px_rgba(37,99,235,0.30)]">
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
            {appointment.department} · SmartHealthcare, {profile?.city || "Chennai"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-white/80">
            <span>{doctorExperience(doctor)}</span>
            <span>·</span>
            <span>{doctorRating(doctor)}</span>
            <span>·</span>
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
      <div className="mt-5 flex items-end gap-4"><div className="relative"><div className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-7xl font-black leading-none text-transparent">{appointment?.token_number ? String(appointment.token_number).padStart(2, "0") : "--"}</div></div><div className="pb-2"><p className="text-xs text-slate-500">Your token for</p><p className="text-lg font-black">{appointment ? formatTime(appointment.slot_time) : "No active token"}</p></div></div>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-cyan-500" style={{ width: appointment?.token_number ? `${Math.min(100, appointment.token_number * 12)}%` : "0%" }} /></div>
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
          return <li key={appointment.appointment_id} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-blue-100 bg-white/65 p-4 transition hover:border-blue-300 hover:shadow-md" onClick={() => setActiveView("appointments")}><DoctorAvatar doctor={doctor} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-black">{doctorTitle(doctor, appointment.doctor_id)}</p><p className="text-sm text-slate-500">{appointment.department} · {doctorExperience(doctor)}</p></div><div className="hidden text-sm font-semibold text-slate-500 sm:block">{formatDate(appointment.appointment_date)}</div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClass(appointment.status)}`}>{appointment.status}</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" /></li>;
        })}
      </ul>
    </GlassCard>
  );
}

function NotificationsCard({ upcomingAppointment }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Notifications</h3><p className="text-sm text-slate-500">Latest updates</p></div><button className="text-sm font-black text-blue-700">View All</button></div>
      <ul className="mt-5 space-y-3"><NotificationItem icon={Bell} title="Your appointment is confirmed" text={upcomingAppointment ? `${formatDate(upcomingAppointment.appointment_date)}, ${formatTime(upcomingAppointment.slot_time)}` : "Book an appointment to receive token details."} tone="primary" /><NotificationItem icon={Building2} title="Health camp at Chennai branch" text="20 July 2026" tone="accent" /><NotificationItem icon={Wallet} title="Discount on full body checkup" text="Till 31 July 2026" tone="success" /></ul>
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

function BookAppointmentView({ doctors, selectedDoctorId, setSelectedDoctorId, selectedDoctor, appointmentDate, setAppointmentDate, slotTime, setSlotTime, paymentMode, setPaymentMode, booking, handleBookAppointment, loading }) {
  return <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]"><GlassCard><h2 className="text-2xl font-black text-[#101735]">Available Doctors</h2><p className="mt-1 text-base text-slate-500">Select your preferred doctor.</p>{loading ? <p className="mt-6 rounded-3xl border border-dashed border-blue-100 p-10 text-center text-base text-slate-500">Loading doctors...</p> : doctors.length === 0 ? <p className="mt-6 rounded-3xl border border-dashed border-blue-100 p-10 text-center text-base text-slate-500">No doctors found for your branch.</p> : <div className="mt-6 grid gap-5 md:grid-cols-2">{doctors.map((doctor) => { const active = selectedDoctorId === doctor.doctor_id; return <button key={doctor.doctor_id} type="button" onClick={() => setSelectedDoctorId(doctor.doctor_id)} className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${active ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100" : "border-blue-100 bg-white/75"}`}><DoctorAvatar doctor={doctor} size="xl" /><h3 className="mt-4 text-lg font-black text-[#101735]">Dr. {doctor.first_name} {doctor.last_name}</h3><p className="mt-1 text-base font-bold text-blue-700">{doctor.department}</p><div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${doctorStatusClass(doctor)}`}><DoctorStatusDot doctor={doctor} /></span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{doctorRating(doctor)}</span></div><p className="mt-3 text-sm font-medium text-slate-500">Doctor ID: {doctor.doctor_id}</p><p className="text-sm font-medium text-slate-500">Department: {doctor.department}</p><p className="text-sm font-medium text-slate-500">{doctorExperience(doctor)}</p><p className="text-sm font-medium text-slate-500">Branch: {doctor.branch_id}</p><p className="text-sm font-medium text-slate-500">Fee: Rs. {doctor.consult_fee || 0}</p></button>; })}</div>}</GlassCard><GlassCard><h2 className="text-2xl font-black text-[#101735]">Book Appointment</h2><form onSubmit={handleBookAppointment} className="mt-7 space-y-6"><div><label className="mb-2 block text-sm font-black text-slate-700">Selected Doctor</label><select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} disabled={doctors.length === 0} className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500 disabled:bg-slate-100">{doctors.length === 0 && <option value="">No doctors available</option>}{doctors.map((doctor) => <option key={doctor.doctor_id} value={doctor.doctor_id}>Dr. {doctor.first_name} {doctor.last_name} - {doctor.department}</option>)}</select></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-black text-slate-700">Date</label><input type="date" value={appointmentDate} min={todayDate()} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500" /></div><div><label className="mb-2 block text-sm font-black text-slate-700">Time Slot</label><select value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500">{TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{formatTime(slot)}</option>)}</select></div></div><div><label className="mb-2 block text-sm font-black text-slate-700">Payment Mode</label><select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-base font-semibold outline-none focus:border-blue-500"><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option></select></div>{selectedDoctor && <div className="rounded-3xl bg-blue-50 p-5 text-base text-slate-700"><div className="mb-4 flex items-center gap-4"><DoctorAvatar doctor={selectedDoctor} /><div><p className="font-black">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p><p className="text-sm text-blue-700">{selectedDoctor.department}</p></div></div><p><b>Doctor ID:</b> {selectedDoctor.doctor_id}</p><p><b>Department:</b> {selectedDoctor.department}</p><p><b>Experience:</b> {doctorExperience(selectedDoctor)}</p><p><b>Rating:</b> {doctorRating(selectedDoctor)}</p><p className="flex items-center gap-2"><b>Status:</b> <DoctorStatusDot doctor={selectedDoctor} /></p><p><b>Branch:</b> {selectedDoctor.branch_id}</p><p><b>Fee:</b> Rs. {selectedDoctor.consult_fee || 0}</p></div>}<button type="submit" disabled={booking || doctors.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800 disabled:opacity-60">{booking ? "Booking..." : "Confirm Appointment"}<CalendarDays size={20} /></button></form></GlassCard></div>;
}

function AppointmentsView({ appointments, doctors }) {
  return <GlassCard><h2 className="text-2xl font-black text-[#101735]">My Appointments</h2><div className="mt-6 overflow-hidden rounded-3xl border border-blue-100"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-blue-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Appointment ID</th><th className="px-5 py-4">Doctor</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Slot</th><th className="px-5 py-4">Token</th><th className="px-5 py-4">Wait</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Fee</th></tr></thead><tbody className="divide-y divide-blue-50 bg-white">{appointments.map((a) => { const doctor = getDoctorForAppointment(doctors, a); return <tr key={a.appointment_id}><td className="px-5 py-4 font-black text-[#101735]">{a.appointment_id}</td><td className="px-5 py-4 font-semibold text-slate-600">{doctorTitle(doctor, a.doctor_id)}</td><td className="px-5 py-4 text-slate-600">{a.department}</td><td className="px-5 py-4 text-slate-600">{a.appointment_date}</td><td className="px-5 py-4 text-slate-600">{formatTime(a.slot_time)}</td><td className="px-5 py-4 text-lg font-black text-blue-700">{a.token_number || "--"}</td><td className="px-5 py-4 text-slate-600">{a.estimated_wait_minutes ?? "--"} mins</td><td className="px-5 py-4"><span className={`rounded-full px-4 py-2 text-xs font-black ${getStatusClass(a.status)}`}>{a.status}</span></td><td className="px-5 py-4 font-black text-slate-700">Rs. {a.consult_fee || 0}</td></tr>; })}</tbody></table></div></div></GlassCard>;
}

function AIHealthAssistantView() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Hi, I am your AI Health Assistant. Ask about appointment preparation, symptoms, diet, or hospital visit guidance.");
  const handleAsk = () => setAnswer(question.trim() ? "Demo suggestion: Please monitor your symptoms, stay hydrated, and discuss your concern with the doctor during your appointment. For emergency symptoms, visit emergency care immediately." : "Please type a health-related question first.");
  return <div className="grid gap-7 xl:grid-cols-[0.8fr_1.2fr]"><GlassCard><Bot className="h-16 w-16 text-blue-700" /><h2 className="mt-6 text-3xl font-black text-[#101735]">AI Health Assistant</h2><p className="mt-2 text-base text-slate-500">Demo assistant for general hospital visit guidance.</p></GlassCard><GlassCard><label className="text-base font-black text-slate-700">Ask your question</label><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={6} placeholder="Example: What should I do before a cardiology appointment?" className="mt-4 w-full rounded-3xl border border-blue-100 p-5 text-base outline-none focus:border-blue-500" /><button onClick={handleAsk} className="mt-5 rounded-2xl bg-blue-700 px-7 py-4 text-base font-black text-white">Ask AI Assistant</button><div className="mt-6 rounded-3xl bg-blue-50 p-6 text-base font-medium text-slate-700">{answer}</div></GlassCard></div>;
}

function MedicalSummaryView({ user, appointments }) {
  return <div className="grid gap-7 xl:grid-cols-3"><SummaryCard title="Blood Group" value="B+" icon={HeartPulse} /><SummaryCard title="Age" value="35 Years" icon={UserRound} /><SummaryCard title="Total Visits" value={appointments.length} icon={ClipboardList} /><GlassCard className="xl:col-span-3"><h2 className="text-2xl font-black text-[#101735]">Medical Summary</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><InfoRow label="Patient Name" value={user?.name || "-"} /><InfoRow label="Patient ID" value={user?.user_id || "-"} /><InfoRow label="City" value={user?.city || "-"} /><InfoRow label="Home Branch" value={user?.branch_id || "-"} /><InfoRow label="Allergies" value="No known allergies" /><InfoRow label="Last Visit Status" value={appointments[0]?.status || "No visits"} /></div></GlassCard></div>;
}

function SummaryCard({ title, value, icon: Icon }) {
  return <GlassCard><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Icon size={32} /></div><p className="mt-5 text-base font-black text-slate-400">{title}</p><p className="mt-2 text-3xl font-black text-[#101735]">{value}</p></GlassCard>;
}

function InfoRow({ label, value }) {
  return <div className="rounded-3xl border border-blue-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-lg font-black text-[#101735]">{value}</p></div>;
}

function BranchesView({ user }) {
  return <GlassCard><h2 className="text-2xl font-black text-[#101735]">Hospital Branches</h2><div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{BRANCHES.map((b) => { const active = b.id === user?.branch_id || b.city === user?.city; return <div key={b.id} className={`rounded-3xl border p-6 ${active ? "border-blue-400 bg-blue-50" : "border-blue-100 bg-white"}`}><Hospital className="h-12 w-12 text-blue-700" /><h3 className="mt-4 text-xl font-black text-[#101735]">{b.city} Branch</h3><p className="mt-1 text-base font-black text-blue-700">{b.id}</p><p className="mt-4 flex items-center gap-2 text-base text-slate-500"><MapPin size={18} /> {b.address}</p><p className="mt-1 text-base text-slate-500">Phone: {b.phone}</p>{active && <span className="mt-5 inline-block rounded-full bg-blue-700 px-4 py-2 text-xs font-black text-white">Your Branch</span>}</div>; })}</div></GlassCard>;
}

function ProfileView({ user, appointments }) {
  return <div className="grid gap-7 xl:grid-cols-[0.7fr_1.3fr]"><GlassCard><div className="flex flex-col items-center text-center"><PatientAvatar profile={user} size="lg" /><h2 className="mt-6 text-3xl font-black text-[#101735]">{user?.name || "Patient"}</h2><p className="mt-1 text-base font-black text-blue-700">{user?.user_id}</p><p className="mt-1 text-base text-slate-500">{user?.city || "Chennai"}</p></div></GlassCard><GlassCard><h2 className="text-2xl font-black text-[#101735]">Patient Profile</h2><div className="mt-7 grid gap-5 md:grid-cols-2"><InfoRow label="Patient ID" value={user?.user_id || "-"} /><InfoRow label="Name" value={user?.name || "-"} /><InfoRow label="Role" value={user?.role || "PATIENT"} /><InfoRow label="City" value={user?.city || "-"} /><InfoRow label="Branch ID" value={user?.branch_id || "-"} /><InfoRow label="Total Appointments" value={appointments.length} /></div></GlassCard></div>;
}

export function CityAdminDashboard() { const { user } = useAuth(); return <AdminShell title={`Welcome, ${user?.user_id} (City Admin)`} subtitle={`Managing data for ${user?.city || "your city"}.`} />; }
export function StateAdminDashboard() { const { user } = useAuth(); return <AdminShell title="Tamil Nadu Healthcare Command Center" subtitle={`Welcome, ${user?.user_id} (State Admin)`} />; }
export function SuperAdminDashboard() { const { user } = useAuth(); return <AdminShell title="Super Admin Console" subtitle={`Welcome, ${user?.user_id}. Full system access.`} />; }

function AdminShell({ title, subtitle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/admin/login", { replace: true }); };
  return <div className="min-h-screen bg-slate-100"><header className="border-b bg-white px-6 py-4"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><h1 className="text-2xl font-black text-slate-900">{title}</h1><p className="text-sm text-slate-500">{subtitle}</p></div><button onClick={handleLogout} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"><LogOut size={16} />Logout</button></div></header><main className="mx-auto max-w-7xl px-6 py-8"><GlassCard><ShieldCheck className="h-12 w-12 text-emerald-700" /><h2 className="mt-5 text-2xl font-black text-slate-900">Admin Dashboard</h2><p className="mt-2 text-slate-500">Admin analytics and management screens will be connected next.</p></GlassCard></main></div>;
}
