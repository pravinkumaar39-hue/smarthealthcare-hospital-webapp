import { Activity } from "lucide-react";

export default function Logo({ size = "md", showTagline = true }) {
  const sizes = {
    sm: { iconBox: "h-10 w-10", icon: 22, title: "text-xl", tagline: "text-xs" },
    md: { iconBox: "h-14 w-14", icon: 28, title: "text-3xl", tagline: "text-sm" },
    lg: { iconBox: "h-16 w-16", icon: 34, title: "text-4xl", tagline: "text-sm" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`${s.iconBox} mb-5 flex items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-300/60`}
      >
        <Activity size={s.icon} className="text-white" strokeWidth={2.4} />
      </div>

      <h1 className={`${s.title} font-extrabold tracking-tight text-slate-800`}>
        SmartCare AI Hospital
      </h1>

      {showTagline && (
        <p className={`${s.tagline} mt-1 font-bold uppercase tracking-[0.25em] text-slate-500`}>
          SmartCare Medical Center
        </p>
      )}
    </div>
  );
}