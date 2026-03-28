import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ transparent = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/track', label: 'Track Status' },
    { to: '/public', label: 'Public Data' },
    { to: '/login', label: 'Official Login' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#FF9933]/10 border-b border-[#FF9933]/20 overflow-hidden">
        <div className="announcement-track flex items-center gap-12 whitespace-nowrap py-1.5 px-4">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 text-xs text-[#FF9933] font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808] animate-pulse" />
                🟢 System Operational
              </span>
              <span>📞 Toll-Free Helpline: +1 570 630 8042</span>
              <span>🇮🇳 Official Government Portal</span>
              <span>🗣️ Available 24×7 in Hindi & English</span>
              <span>🔒 TRAI Compliant | Data Protected</span>
              <span>⏱️ Response within 48 hours</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`fixed top-[30px] left-0 right-0 z-50 transition-all duration-300 ${
          transparent
            ? 'bg-transparent'
            : 'bg-[#0A1628]/95 backdrop-blur-xl border-b border-[#FF9933]/20'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl">🇮🇳</span>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  JanSamvaad
                </span>
                <span className="text-[10px] text-[#FF9933] font-medium leading-tight hidden sm:block">
                  Ministry of Housing & Urban Affairs
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/30'
                      : 'text-[#E8EDF2]/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <span className={`w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          } bg-[#0A1628]/98 backdrop-blur-xl border-t border-[#FF9933]/10`}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-[#FF9933]/15 text-[#FF9933]'
                    : 'text-[#E8EDF2]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
