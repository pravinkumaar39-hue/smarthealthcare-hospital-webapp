import { useMemo } from "react";
import { Building2, CalendarCheck, Copy, Download, ShieldCheck, Stethoscope, TrendingUp, Users } from "lucide-react";
import Logo from "../components/Logo";

const fallbackSnapshot = {
  generatedAt: new Date().toISOString(),
  branches: 10,
  doctors: 100,
  activeDoctors: 100,
  appointments: 100,
  todayAppointments: 0,
  totalRevenue: 71900,
  todayRevenue: 0,
  topBranch: "Coimbatore",
  highDemandDepartment: "General Medicine",
  activeCityAdmins: "7/10",
  branchRanking: [
    { city: "Coimbatore", appointments: 18, doctors: 10, todayAppointments: 0 },
    { city: "Trichy", appointments: 15, doctors: 10, todayAppointments: 0 },
    { city: "Chennai", appointments: 14, doctors: 10, todayAppointments: 0 },
    { city: "Madurai", appointments: 12, doctors: 10, todayAppointments: 0 },
    { city: "Salem", appointments: 10, doctors: 10, todayAppointments: 0 },
  ],
  departmentDemand: [
    { department: "General Medicine", count: 25 },
    { department: "Cardiology", count: 18 },
    { department: "Orthopedics", count: 15 },
    { department: "Dermatology", count: 12 },
  ],
};

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Demo snapshot";
  }
}

export default function ExecutiveSnapshotPublic() {
  const snapshot = useMemo(() => {
    try {
      const saved = localStorage.getItem("smarthealthcare_executive_snapshot");
      return saved ? JSON.parse(saved) : fallbackSnapshot;
    } catch {
      return fallbackSnapshot;
    }
  }, []);

  const summaryText = `SmartHealthcare Executive Snapshot

Audience: CEO / HR / Hospital Leadership
Access Type: Read-only management view
Data Privacy: No patient personal data shown

Network Summary:
Total Branches: ${snapshot.branches}
Total Doctors: ${snapshot.doctors}
Active Doctors: ${snapshot.activeDoctors}
Total Appointments: ${snapshot.appointments}
Today Appointments: ${snapshot.todayAppointments}
Total Revenue: ${formatMoney(snapshot.totalRevenue)}
Today Revenue: ${formatMoney(snapshot.todayRevenue)}

Performance Summary:
Top Branch: ${snapshot.topBranch}
High Demand Department: ${snapshot.highDemandDepartment}
Active City Admins: ${snapshot.activeCityAdmins}

Smart Care. Better Health. Better Life.`;

  const copySummary = async () => {
    await navigator.clipboard.writeText(summaryText);
    alert("Executive summary copied successfully.");
  };

  const printPage = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#eef5ff] text-slate-950">
      <div className="mx-auto max-w-[1400px] px-5 py-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-900 to-emerald-700 p-7 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="w-fit rounded-3xl bg-white px-5 py-3 shadow-xl">
                <Logo size="sm" />
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
                CEO / HR Read-only Management View
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight lg:text-5xl">
                Executive Snapshot
              </h1>

              <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">
                A professional leadership report for hospital decision makers.
                This page shows operational KPIs only and does not expose patient
                personal data, medical records, phone numbers, or confidential information.
              </p>

              <p className="mt-4 text-sm font-bold text-white/70">
                Generated: {formatDateTime(snapshot.generatedAt)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                onClick={copySummary}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-blue-900 shadow-xl"
              >
                <Copy size={18} />
                Copy Summary
              </button>

              <button
                onClick={printPage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-sm font-black text-white"
              >
                <Download size={18} />
                Print / Save PDF
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Building2} label="Total Branches" value={snapshot.branches} note="Tamil Nadu network" />
          <KpiCard icon={Stethoscope} label="Doctors" value={snapshot.doctors} note={`${snapshot.activeDoctors} active doctors`} />
          <KpiCard icon={CalendarCheck} label="Appointments" value={snapshot.appointments} note={`${snapshot.todayAppointments} today`} />
          <KpiCard icon={TrendingUp} label="Revenue" value={formatMoney(snapshot.totalRevenue)} note={`Today ${formatMoney(snapshot.todayRevenue)}`} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-7 shadow-xl shadow-blue-100/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                  Branch Performance
                </p>
                <h2 className="mt-2 text-2xl font-black">Top Performing Branches</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                Top Branch: {snapshot.topBranch}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {(snapshot.branchRanking || []).slice(0, 5).map((branch, index) => (
                <div key={branch.city} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-700 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{branch.city}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {branch.doctors} doctors · {branch.todayAppointments} appointments today
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-700">{branch.appointments}</p>
                    <p className="text-xs font-semibold text-slate-500">total appointments</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-xl shadow-emerald-100/60">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
                HR Staffing Insight
              </p>
              <h2 className="mt-2 text-2xl font-black">Department Demand</h2>
            </div>

            <div className="mt-6 space-y-4">
              {(snapshot.departmentDemand || []).slice(0, 5).map((item) => {
                const max = Math.max(...(snapshot.departmentDemand || [{ count: 1 }]).map((x) => x.count || 1));
                const width = Math.min(100, ((item.count || 0) / max) * 100);

                return (
                  <div key={item.department} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-black">{item.department}</p>
                      <p className="text-sm font-black text-emerald-700">{item.count} appointments</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <InfoCard
            icon={ShieldCheck}
            title="Data Privacy"
            text="This report is leadership-safe. It does not show patient names, mobile numbers, diagnosis, medical history, or confidential clinical information."
          />
          <InfoCard
            icon={Users}
            title="Admin Monitoring"
            text={`Active City Admins: ${snapshot.activeCityAdmins}. This helps leadership monitor branch-level administrative readiness.`}
          />
          <InfoCard
            icon={TrendingUp}
            title="Management Note"
            text={`Focus on ${snapshot.highDemandDepartment} and monitor ${snapshot.topBranch} branch performance for operational planning.`}
          />
        </section>

        <footer className="mt-8 rounded-[2rem] bg-white p-6 text-center shadow-lg">
          <p className="text-sm font-black text-slate-600">
            Smart Care. Better Health. Better Life.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            SmartHealthcare Executive Snapshot · Demo Read-only Report Page
          </p>
        </footer>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-blue-100/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-[#101735]">{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{note}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-100">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p>
    </div>
  );
}
