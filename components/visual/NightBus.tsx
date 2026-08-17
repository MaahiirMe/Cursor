"use client";

export function NightBus() {
  return (
    <div className="bus-wrap relative mx-auto w-full max-w-lg" aria-hidden>
      <svg viewBox="0 0 640 280" className="bus-ride w-full">
        <defs>
          <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1a140f" />
            <stop offset="1" stopColor="#0c0907" />
          </linearGradient>
          <pattern id="truck" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#d45512" />
            <path d="M0 12h24M12 0v24" stroke="#f5c518" strokeWidth="2" />
            <rect x="2" y="2" width="8" height="8" fill="#1ec8c8" />
          </pattern>
        </defs>
        <ellipse cx="320" cy="250" rx="240" ry="14" fill="#000" opacity="0.45" />
        <rect x="40" y="228" width="560" height="18" fill="url(#road)" />
        <rect x="40" y="236" width="560" height="3" fill="#f5c518" opacity="0.7" className="road-dash" />
        <g>
          <rect x="70" y="78" width="460" height="130" rx="8" fill="#1b120c" stroke="#f5c518" strokeWidth="4" />
          <rect x="86" y="94" width="300" height="78" fill="url(#truck)" />
          <rect x="400" y="94" width="112" height="78" fill="#87c6e8" opacity="0.85" />
          <circle cx="456" cy="128" r="10" fill="#0c0907" />
          <rect x="70" y="70" width="460" height="14" fill="#ff6a00" />
          <rect x="90" y="52" width="70" height="22" fill="#6b2414" />
          <rect x="170" y="48" width="90" height="26" fill="#3a2a20" />
          <rect x="270" y="50" width="50" height="22" fill="#1ec8c8" />
          <polygon points="530,140 590,150 590,168 530,175" fill="#f6efe3" className="headlight" />
          <circle cx="150" cy="214" r="28" fill="#111" stroke="#f5c518" strokeWidth="4" />
          <circle cx="430" cy="214" r="28" fill="#111" stroke="#f5c518" strokeWidth="4" />
          <circle cx="150" cy="214" r="10" fill="#8d8d86" />
          <circle cx="430" cy="214" r="10" fill="#8d8d86" />
        </g>
      </svg>
    </div>
  );
}
