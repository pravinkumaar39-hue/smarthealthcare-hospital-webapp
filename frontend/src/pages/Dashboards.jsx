import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  Hospital,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getDoctors,
  getMyAppointments,
  bookAppointment,
} from "../api/client";

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFirstUpcomingAppointment(appointments) {
  const today = todayDate();

  return (
    appointments
      .filter((item) => item.appointment_date >= today)
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0] ||
    appointments[0]
  );
}

function PatientLayout({ children, activeView, setActiveView }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "book", label: "Book Appointment", icon: CalendarDays },
    { id: "appointments", label: "My Appointments", icon: ClipboardList },
    { id: "ai", label: "AI Health Assistant", icon: Bot },
    { id: "summary", label: "Medical Summary", icon: FileText },
    { id: "branches", label: "Hospital Branches", icon: Hospital },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-gradient-to-b from-blue-800 via-blue-700 to-blue-950 p-5 text-white shadow-2xl lg:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <HeartPulse size={26} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">SmartHealthcare</h2>
              <p className="text-xs font-medium text-blue-100">
                Patient Portal
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-white/18 text-white shadow-lg"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-3xl bg-white/12 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Need Help?</p>
                  <p className="text-xs text-blue-100">Contact Support</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-h-screen flex-1 lg:ml-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-200 p-2 lg:hidden">
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Good Evening, {user?.name || "Patient"} 👋
                  </h1>
                  <p className="text-sm text-slate-500">
                    Take care of your health. We are here to help you.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none sm:block">
                  <option>{user?.city || "Chennai"}</option>
                </select>

                <button className="relative rounded-2xl border border-slate-200 p-3 text-slate-600">
                  <Bell size={18} />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <UserRound size={22} />
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();

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

  const selectedDoctor = useMemo(() => {
    return doctors.find((doctor) => doctor.doctor_id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const upcomingAppointment = useMemo(() => {
    return getFirstUpcomingAppointment(appointments);
  }, [appointments]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorRes, appointmentRes] = await Promise.all([
        getDoctors(),
        getMyAppointments(),
      ]);

      const doctorData = doctorRes.data || [];
      const appointmentData = appointmentRes.data || [];

      setDoctors(doctorData);
      setAppointments(appointmentData);

      if (doctorData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorData[0].doctor_id);
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

      setSuccess(
        `Appointment booked successfully. Appointment ID: ${res.data.appointment_id}`
      );

      setActiveView("appointments");
      await loadDashboardData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Appointment booking failed. Please try another slot."
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <PatientLayout activeView={activeView} setActiveView={setActiveView}>
      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {activeView === "dashboard" && (
        <DashboardHome
          user={user}
          loading={loading}
          appointments={appointments}
          upcomingAppointment={upcomingAppointment}
          setActiveView={setActiveView}
        />
      )}

      {activeView === "book" && (
        <BookAppointmentView
          doctors={doctors}
          selectedDoctorId={selectedDoctorId}
          setSelectedDoctorId={setSelectedDoctorId}
          selectedDoctor={selectedDoctor}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          slotTime={slotTime}
          setSlotTime={setSlotTime}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          booking={booking}
          handleBookAppointment={handleBookAppointment}
          loading={loading}
          loadDashboardData={loadDashboardData}
        />
      )}

      {activeView === "appointments" && (
        <AppointmentsView appointments={appointments} />
      )}

      {activeView === "ai" && <ComingSoonCard title="AI Health Assistant" />}
      {activeView === "summary" && <ComingSoonCard title="Medical Summary" />}
      {activeView === "branches" && <ComingSoonCard title="Hospital Branches" />}
      {activeView === "profile" && <ComingSoonCard title="Patient Profile" />}
    </PatientLayout>
  );
}

function DashboardHome({
  user,
  loading,
  appointments,
  upcomingAppointment,
  setActiveView,
}) {
  const recentAppointments = appointments.slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr_0.7fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Upcoming Appointment
            </h2>
            <CalendarCheck className="text-blue-600" size={22} />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading appointment...</p>
          ) : upcomingAppointment ? (
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                <Stethoscope size={30} />
              </div>

              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900">
                  Dr. {upcomingAppointment.doctor_id}
                </h3>
                <p className="text-sm font-semibold text-blue-700">
                  {upcomingAppointment.department}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={15} />
                  {formatDate(upcomingAppointment.appointment_date)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={15} />
                  {upcomingAppointment.slot_time}
                </p>

                <button
                  onClick={() => setActiveView("appointments")}
                  className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500">
                No upcoming appointment found.
              </p>
              <button
                onClick={() => setActiveView("book")}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
              >
                Book Now
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            Token Number
          </h2>
          <p className="mt-5 text-5xl font-black text-blue-700">
            {upcomingAppointment ? "07" : "--"}
          </p>
          <p className="mt-4 text-sm text-slate-500">Your token for</p>
          <p className="text-sm font-bold text-slate-800">
            {upcomingAppointment
              ? `${upcomingAppointment.slot_time} - ${formatDate(
                  upcomingAppointment.appointment_date
                )}`
              : "No active token"}
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Estimated wait: 35 mins
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            Health Summary
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Blood Group
              </p>
              <p className="text-2xl font-black text-red-500">B+</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400">Age</p>
              <p className="text-2xl font-black text-blue-700">35 Years</p>
            </div>

            <button
              onClick={() => setActiveView("profile")}
              className="text-sm font-bold text-blue-700"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Appointments
            </h2>
            <button
              onClick={() => setActiveView("appointments")}
              className="text-sm font-bold text-blue-700"
            >
              View All
            </button>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No recent appointments.</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Stethoscope size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Dr. {appointment.doctor_id}
                      </p>
                      <p className="text-sm text-slate-500">
                        {appointment.department}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {formatDate(appointment.appointment_date)}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Notifications
            </h2>
            <button className="text-sm font-bold text-blue-700">View All</button>
          </div>

          <div className="space-y-3">
            <NotificationItem
              title="Your appointment is confirmed"
              text="Please arrive 10 minutes earlier."
            />
            <NotificationItem
              title="Health camp at Chennai branch"
              text="Free checkup available this weekend."
            />
            <NotificationItem
              title="Discount on full body checkup"
              text="Valid till 31 July 2026."
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
              <Bot size={34} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                AI Health Assistant
              </h2>
              <p className="text-sm text-slate-500">
                Ask any health related questions and get instant suggestions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView("ai")}
            className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100"
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ title, text }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Bell size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{text}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-400" />
    </div>
  );
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
  loadDashboardData,
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Available Doctors
            </h2>
            <p className="text-sm text-slate-500">
              Select your preferred doctor.
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 rounded-xl border border-blue-100 px-3 py-2 text-sm font-bold text-blue-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading doctors...
          </p>
        ) : doctors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No doctors found for your branch.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.map((doctor) => {
              const active = selectedDoctorId === doctor.doctor_id;

              return (
                <button
                  key={doctor.doctor_id}
                  onClick={() => setSelectedDoctorId(doctor.doctor_id)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-100 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Stethoscope size={24} />
                  </div>

                  <h3 className="font-extrabold text-slate-900">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="text-sm font-bold text-blue-700">
                    {doctor.department}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Branch: {doctor.branch_id}
                  </p>
                  <p className="text-sm text-slate-500">
                    Fee: ₹{doctor.consult_fee || 0}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">
          Book Appointment
        </h2>
        <p className="text-sm text-slate-500">Select date, time, and payment.</p>

        <form onSubmit={handleBookAppointment} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Selected Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  Dr. {doctor.first_name} {doctor.last_name} -{" "}
                  {doctor.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                min={todayDate()}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Time Slot
              </label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {selectedDoctor && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <b>Branch:</b> {selectedDoctor.branch_id}
              </p>
              <p>
                <b>Department:</b> {selectedDoctor.department}
              </p>
              <p>
                <b>Fee:</b> ₹{selectedDoctor.consult_fee || 0}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={booking || doctors.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 font-extrabold text-white shadow-lg shadow-blue-100 disabled:opacity-60"
          >
            {booking ? "Booking..." : "Confirm Appointment"}
            <CalendarDays size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

function AppointmentsView({ appointments }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-900">
        My Appointments
      </h2>
      <p className="text-sm text-slate-500">Your appointment history.</p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Appointment ID</th>
                <th className="px-5 py-4">Doctor</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Slot</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Fee</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.appointment_id}>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {appointment.appointment_id}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {appointment.doctor_id}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {appointment.department}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {appointment.appointment_date}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {appointment.slot_time}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-700">
                    ₹{appointment.consult_fee || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ComingSoonCard({ title }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
        <Sparkles size={32} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-500">
        This section will be connected in the next module.
      </p>
    </div>
  );
}

export function CityAdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminShell
      title={`Welcome, ${user?.user_id} (City Admin)`}
      subtitle={`Managing data for ${user?.city || "your city"}.`}
    />
  );
}

export function StateAdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminShell
      title="Tamil Nadu Healthcare Command Center"
      subtitle={`Welcome, ${user?.user_id} (State Admin)`}
    />
  );
}

export function SuperAdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminShell
      title="Super Admin Console"
      subtitle={`Welcome, ${user?.user_id}. Full system access.`}
    />
  );
}

function AdminShell({ title, subtitle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
            <ShieldCheck size={32} />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-slate-500">
            Admin analytics and management screens will be connected next.
          </p>
        </div>
      </main>
    </div>
  );
}