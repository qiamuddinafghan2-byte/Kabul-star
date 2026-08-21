export function StarLogo({ size = 44, className = "" }) {
  // Navy five-point star with gold diagonal swoosh and small gold star
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ksNavy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#0F1E4F" />
        </linearGradient>
        <linearGradient id="ksGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5D06B" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      {/* main navy star */}
      <path
        d="M32 3 L39.6 22.4 L60 24.2 L44.3 37.8 L49.6 58 L32 47 L14.4 58 L19.7 37.8 L4 24.2 L24.4 22.4 Z"
        fill="url(#ksNavy)"
      />
      {/* gold diagonal swoosh */}
      <path
        d="M6 44 C 22 26, 42 22, 60 8"
        stroke="url(#ksGold)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* small gold star */}
      <path
        d="M52 12 L54 17 L59 17.5 L55 21 L56.3 26 L52 23.3 L47.7 26 L49 21 L45 17.5 L50 17 Z"
        fill="url(#ksGold)"
      />
    </svg>
  );
}

export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <StarLogo size={compact ? 36 : 44} />
      <div className="leading-tight">
        <div className="font-serif font-black tracking-tight text-[15px] md:text-base text-[#0F1E4F]">
          KABUL STAR
        </div>
        <div className="text-[10px] md:text-[11px] tracking-[0.18em] font-semibold text-[#B8860B]">
          ENGLISH LANGUAGE ACADEMY
        </div>
      </div>
    </div>
  );
}
