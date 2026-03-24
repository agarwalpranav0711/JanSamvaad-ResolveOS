import { memo } from 'react';

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

const Sidebar = memo(function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, operatorName }) {
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
          <span className="text-xl flex-shrink-0">🇮🇳</span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-white truncate whitespace-nowrap block">
                JanSamvaad <span className="text-[#E8EDF2] font-normal">ResolveOS</span>
              </span>
              <span className="text-[9px] text-[#FF9933] block truncate">Municipal Operations Portal</span>
            </div>
          )}
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A1628] border-t border-white/10 flex items-center justify-around px-1 py-1 safe-area-bottom">
        {[
          { key: 'overview', icon: '🏠', label: 'Home' },
          { key: 'gis', icon: '🗺️', label: 'Map' },
          { key: 'ledger', icon: '📋', label: 'Tickets' },
          { key: 'analytics', icon: '📊', label: 'Stats' },
          { key: 'more', icon: '⚙️', label: 'More' },
        ].map((tab) => {
          const active = tab.key === 'more'
            ? !['overview', 'gis', 'ledger', 'analytics'].includes(activePage)
            : activePage === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onNavigate(tab.key === 'more' ? 'settings' : tab.key)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[56px] min-h-[44px] rounded-lg transition-all duration-200 ${
                active ? 'text-[#FF9933]' : 'text-[#8A9BB5]/40'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
});

export default Sidebar;
export { NAV_ITEMS };
