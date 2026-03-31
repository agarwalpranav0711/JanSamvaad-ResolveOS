import { memo } from 'react';
import BrandLogo from './BrandLogo';

const NAV_ITEMS = [
  { key: 'overview', icon: '🏠', label: 'Overview' },
  { key: 'gis', icon: '🗺️', label: 'GIS Map' },
  { key: 'ledger', icon: '📋', label: 'Grievance Ledger' },
  { key: 'analytics', icon: '📊', label: 'Analytics' },
  { key: 'activity', icon: '⚡', label: 'Activity Log' },
  { key: 'officers', icon: '🏆', label: 'Officer Performance' },
  { key: 'reports', icon: '📄', label: 'Reports' },
  { key: 'qr', icon: '📱', label: 'QR Scanner' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

const Sidebar = memo(function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, operatorName, mobileOpen, onMobileClose }) {
  const initials = (operatorName || 'OP').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-50 bg-[#0A1628] border-r border-white/5 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-white/5 flex-shrink-0">
          <BrandLogo size="md" showText={!collapsed} textColor="text-white" />
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mx-auto my-2 flex items-center justify-center w-8 h-6 rounded-md text-xs text-[#8A9BB5]/50 hover:bg-white/5 transition-all"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#FF9933]/10 text-[#FF9933] border-l-[3px] border-[#FF9933] pl-[9px]'
                    : 'text-[#8A9BB5]/70 hover:text-white hover:bg-white/[0.03] border-l-[3px] border-transparent pl-[9px]'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-[#8A9BB5]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#138808] animate-pulse" />
              All Services Operational
            </div>
          </div>
        )}

        {/* Operator */}
        <div className="border-t border-white/5 px-3 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#FF9933]/15 flex items-center justify-center text-xs font-bold text-[#FF9933] flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{operatorName || 'Operator'}</p>
              <p className="text-[10px] text-[#8A9BB5]/50">Municipal Officer</p>
            </div>
          )}
        </div>
      </aside>

      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onMobileClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] bg-[#0A1628] border-r border-white/10 p-4 transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BrandLogo size="md" showText={true} textColor="text-white" />
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              className="h-10 w-10 rounded-lg border border-white/20 text-white"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  aria-label={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'text-[#8A9BB5]/80 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
});

export default Sidebar;
export { NAV_ITEMS };
