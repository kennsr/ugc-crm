export default function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const sizes = {
    sm: { w: 20, h: 20 },
    lg: { w: 28, h: 28 },
  };
  const s = sizes[size];

  return (
    <svg
      width={s.w}
      height={s.h}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect width="32" height="32" rx="6" fill="#0a0a0f" />
      <path d="M12 10v12l10-6-10-6z" fill="#00FF88" />
      <circle cx="24" cy="8" r="4" fill="#00FF88" opacity="0.3" />
      <circle cx="24" cy="8" r="2" fill="#00FF88" />
    </svg>
  );
}
