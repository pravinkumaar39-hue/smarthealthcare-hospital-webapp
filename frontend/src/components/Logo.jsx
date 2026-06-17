export default function Logo({
  size = "md",
  city = "",
  subtitle = "",
  compact = false,
  variant = "default",
  className = "",
}) {
  const sizeMap = {
    sm: {
      img: "w-40",
      city: "text-xs",
      subtitle: "text-xs",
      card: "p-3",
    },
    md: {
      img: "w-52",
      city: "text-sm",
      subtitle: "text-sm",
      card: "p-3",
    },
    lg: {
      img: "w-64",
      city: "text-base",
      subtitle: "text-sm",
      card: "p-4",
    },
    xl: {
      img: "w-72",
      city: "text-lg",
      subtitle: "text-base",
      card: "p-4",
    },
  };

  const s = sizeMap[size] || sizeMap.md;
  const sidebar = variant === "sidebar";

  if (sidebar) {
    return (
      <div
        className={`rounded-[1.6rem] bg-white/95 ${s.card} text-center shadow-xl ring-1 ring-white/70 backdrop-blur ${className}`}
      >
        <img
          src="/brand/smarthealthcare_logo_transparent.png"
          alt="SmartHealthcare Hospital"
          className="mx-auto h-auto w-full max-w-[190px] object-contain"
        />

        {city ? (
          <p className={`mt-1 font-black leading-none text-slate-700 ${s.city}`}>
            {city}
          </p>
        ) : null}

        {subtitle ? (
          <p className={`mt-1 font-bold leading-none text-slate-500 ${s.subtitle}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        compact ? "items-center gap-3" : "flex-col items-center"
      } ${className}`}
    >
      <img
        src="/brand/smarthealthcare_logo_transparent.png"
        alt="SmartHealthcare Hospital"
        className={`${compact ? "w-44" : s.img} h-auto object-contain drop-shadow-sm`}
      />

      {city ? (
        <p className={`mt-1 font-black leading-none text-slate-700 ${s.city}`}>
          {city}
        </p>
      ) : null}

      {subtitle ? (
        <p className={`mt-1 font-semibold leading-none text-primary-700/80 ${s.subtitle}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
