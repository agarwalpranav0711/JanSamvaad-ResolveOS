export default function BrandLogo({ size = 'md', showText = true, textColor = 'text-white' }) {
  const dimensions = { sm: 24, md: 32, lg: 48 }[size];

  return (
    <div className="flex items-center gap-2">
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="13" width="3" height="6" rx="1.5" fill="#F97316" />
        <rect x="7" y="10" width="3" height="12" rx="1.5" fill="#F97316" />
        <rect x="12" y="7" width="3" height="18" rx="1.5" fill="#F97316" />
        <circle cx="22" cy="16" r="4" stroke="#F97316" strokeWidth="2" fill="none" />
        <line x1="22" y1="8" x2="22" y2="12" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="20" x2="22" y2="24" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="12" x2="29" y2="9" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="20" x2="29" y2="23" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="7" r="2" fill="#F97316" />
        <circle cx="22" cy="25" r="2" fill="#F97316" />
        <circle cx="30" cy="8" r="2" fill="#F97316" />
        <circle cx="30" cy="24" r="2" fill="#F97316" />
      </svg>
      {showText && (
        <span className={`font-bold text-lg tracking-tight ${textColor}`}>
          JanSamvaad
        </span>
      )}
    </div>
  );
}
