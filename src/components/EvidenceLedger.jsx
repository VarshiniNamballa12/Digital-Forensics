import React, { useState } from 'react';
import { 
  Database, Search, Filter, RefreshCw, Copy, Check, 
  ExternalLink, ShieldCheck, AlertTriangle, FileText, ChevronRight 
} from 'lucide-react';

export default function EvidenceLedger({ 
  evidences = [], 
  isLoading, 
  onRefresh, 
  onVerifyEvidence, 
  onSimulateTamper, 
  onOpenReport 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Filter evidences by search
  const filteredEvidences = evidences.filter((ev) => {
    const term = searchTerm.toLowerCase();
    return (
      ev.evidence_id?.toLowerCase().includes(term) ||
      ev.case_id?.toLowerCase().includes(term) ||
      ev.file_name?.toLowerCase().includes(term) ||
      ev.file_hash?.toLowerCase().includes(term) ||
      ev.investigator?.toLowerCase().includes(term)
    );
  });

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Immutable Chain of Custody</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ethereum Evidence Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Cryptographically anchored digital evidence records retrieved from smart contract storage.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case, Evidence ID, Filename, or Hash..."
            className="w-full bg-[#05080f] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
          <span>Showing:</span>
          <span className="text-cyan-400 font-bold">{filteredEvidences.length}</span>
          <span>of</span>
          <span className="text-slate-200 font-bold">{evidences.length} records</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="cyber-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#05080f] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Evidence / Case ID</th>
                <th className="py-3.5 px-4 font-semibold">File Metadata</th>
                <th className="py-3.5 px-4 font-semibold">Cryptographic SHA-256 Hash</th>
                <th className="py-3.5 px-4 font-semibold">Block / Time</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Reading smart contract state from Ethereum...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvidences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No evidence records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'Upload an evidence file to anchor your first case record.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvidences.map((ev) => (
                  <tr key={ev.evidence_id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Evidence ID & Case */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-cyan-400">{ev.evidence_id}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">{ev.case_id}</span>
                      </div>
                    </td>

                    {/* File Info */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-slate-200 font-medium truncate" title={ev.file_name}>
                          {ev.file_name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {ev.file_size ? `${(ev.file_size / 1024).toFixed(1)} KB` : 'Unknown size'} &bull; {ev.file_type || 'binary'}
                        </span>
                      </div>
                    </td>

                    {/* SHA-256 Hash */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-[11px] text-slate-300 bg-[#05080f] px-2 py-1 rounded border border-slate-800 truncate max-w-[180px] font-mono"
                          title={ev.file_hash}
                        >
                          {ev.file_hash}
                        </span>
                        <button
                          onClick={() => handleCopy(ev.file_hash, ev.evidence_id)}
                          className="text-slate-400 hover:text-cyan-300 p-1"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedId === ev.evidence_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Block & Timestamp */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-slate-300 font-semibold">
                          Block #{ev.block_number ?? '---'}
                        </span>
                        <span className="text-slate-500">
                          {ev.timestamp_iso ? new Date(ev.timestamp_iso).toLocaleDateString() : 'Recorded'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onVerifyEvidence(ev.evidence_id, ev.file_hash)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-1 transition-all"
                          title="Verify Integrity"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>

                        <button
                          onClick={() => onSimulateTamper(ev.evidence_id)}
                          className="px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[11px] flex items-center space-x-1 transition-all"
                          title="Test Tampering Simulation"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Tamper Test</span>
                        </button>

                        {onOpenReport && (
                          <button
                            onClick={() => onOpenReport(ev)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                            title="Generate Forensic Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
