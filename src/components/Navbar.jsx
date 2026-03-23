import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ transparent = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/track', label: 'Track Complaint' },
    { to: '/public', label: 'Public Data' },
    { to: '/login', label: 'Operator Login' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#10b981]/10 border-b border-[#10b981]/20 overflow-hidden">
        <div className="announcement-track flex items-center gap-12 whitespace-nowrap py-1.5 px-4">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 text-xs text-[#10b981] font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE SYSTEM
              </span>
              <span>📞 Call +1 570 630 8042</span>
              <span>🗣️ Speak in Hindi or English</span>
              <span>⚡ Instant AI Processing</span>
              <span>🤖 Gemini-Powered Classification</span>
              <span>📊 Real-Time Dashboard</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`fixed top-[30px] left-0 right-0 z-50 transition-all duration-300 ${
          transparent
            ? 'bg-transparent'
            : 'bg-[#0a0f14]/90 backdrop-blur-xl border-b border-white/5'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🗣️</span>
              <span className="text-lg font-bold text-[#f8f5f0] tracking-tight group-hover:text-[#10b981] transition-colors duration-200">
                JanSamvaad <span className="font-light text-[#a3c9aa]">ResolveOS</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      : 'text-[#f8f5f0]/70 hover:text-[#f8f5f0] hover:bg-white/5'
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
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-0.5 bg-[#f8f5f0] transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-[#f8f5f0] transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-[#f8f5f0] transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          } bg-[#0a0f14]/95 backdrop-blur-xl border-t border-white/5`}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-[#10b981]/20 text-[#10b981]'
                    : 'text-[#f8f5f0]/70 hover:text-[#f8f5f0] hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes announcement-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .announcement-track {
          animation: announcement-scroll 25s linear infinite;
        }
      `}</style>
    </>
  );
}
