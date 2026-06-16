import { forwardRef } from "react";

const FormInput = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className = "",
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon size={18} />
            </div>
          )}

          <input
            ref={ref}
            type={type}
            {...props}
            className={`w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
              Icon ? "pl-10" : ""
            } ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
          />
        </div>

        {error && (
          <p className="text-sm font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;