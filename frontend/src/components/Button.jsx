import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/30",
  outline:
    "border-2 border-primary-600 text-primary-700 hover:bg-primary-50 bg-white/60",
  ghost: "text-primary-700 hover:bg-primary-50",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
