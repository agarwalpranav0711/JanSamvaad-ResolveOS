import { useState, useCallback } from 'react';

const API = 'https://jansamvaad-backend-608936922611.asia-south1.run.app';

export default function QRScanner() {
  const [ref, setRef] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    if (!ref.trim()) return;
    setLoading(true); setError(''); setTicket(null);
    try {
      const res = await fetch(`${API}/api/public/tickets?ref=${ref.trim()}`);
      if (!res.ok) throw new Error('Ticket not found');
      const data = await res.json();
      setTicket(data);
    } catch (e) {
      setError(e.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  }, [ref]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') search(); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[white]">QR Scanner & Lookup</h2>
        <p className="text-xs text-[#8A9BB5]/50">Enter ticket reference or scan QR code</p>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticket reference (e.g. JS-ABCDEF)"
          className="flex-1 px-4 py-3 rounded-xl bg-[#112240] border border-white/10 text-[white] text-sm placeholder:text-[#8A9BB5]/30 outline-none focus:border-[#FF9933]/40 transition-all"
        />
        <button
          onClick={search}
          disabled={loading || !ref.trim()}
          className="px-6 py-3 rounded-xl bg-[#FF9933] text-black font-semibold text-sm hover:bg-[#E6841C] transition-all disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">⚠️ {error}</div>
      )}

      {ticket && (
        <div className="rounded-2xl border border-white/10 bg-[#112240]/80 p-6 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#FF9933] font-mono">{ticket.ref}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              ticket.status === 'resolved' || ticket.status === 'closed'
                ? 'bg-[#138808]/15 text-[#22AA22]'
                : 'bg-blue-500/15 text-blue-300'
            }`}>
              {ticket.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#8A9BB5]/40 mb-0.5">Category</p>
              <p className="text-[white] capitalize">{ticket.category || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A9BB5]/40 mb-0.5">Severity</p>
              <p className="text-[white]">{ticket.severity || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A9BB5]/40 mb-0.5">Ward</p>
              <p className="text-[white]">{ticket.ward_name || `Ward ${ticket.ward_id || '—'}`}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A9BB5]/40 mb-0.5">Filed</p>
              <p className="text-[white]">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#8A9BB5]/40 mb-3">Resolution Proof QR</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.ref}`}
              alt="Ticket QR"
              className="mx-auto rounded-lg border border-white/10"
              width={150}
              height={150}
            />
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="mt-4 w-full py-2.5 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] text-sm font-semibold border border-[#3b82f6]/30 hover:bg-[#3b82f6]/30 transition-all"
          >
            🖨️ Print Ticket
          </button>
        </div>
      )}
    </div>
  );
}
