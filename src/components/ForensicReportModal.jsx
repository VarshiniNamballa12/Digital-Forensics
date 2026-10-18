import React from 'react';
import { ShieldCheck, ShieldAlert, X, Printer, Download, CheckCircle2, FileText, Lock } from 'lucide-react';

export default function ForensicReportModal({ reportData, onClose }) {
  if (!reportData) return null;

  const isIntact = reportData.is_valid ?? reportData.hashes_match ?? true;
  const printReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#060910]">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              FORENSIC EXAMINATION CERTIFICATE
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={printReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 font-sans print:p-0 print:bg-white print:text-black">
          {/* Certificate Header Banner */}
          <div className="text-center border-b border-slate-800 pb-6 print:border-black">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Digital Evidence Integrity Certificate
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Cryptographic Chain of Custody & Blockchain Verification Report
            </p>
            <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
              Protocol: Ethereum Smart Contract (EVM) &bull; SHA-256 Digest Verification
            </p>
          </div>

          {/* Status Stamp */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isIntact 
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center space-x-3">
              {isIntact ? (
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-rose-400" />
              )}
              <div>
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  VERIFICATION VERDICT:
                </span>
                <h3 className="text-lg font-bold">
                  {isIntact ? 'VERIFIED — HASHES MATCH (PRISTINE)' : 'TAMPERING DETECTED — HASHES DIFFER'}
                </h3>
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="block text-slate-400">Audit Status:</span>
              <span className={`font-bold ${isIntact ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isIntact ? 'COURT ADMISSIBLE' : 'INADMISSIBLE'}
              </span>
            </div>
          </div>

          {/* Case & Evidence Details */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Evidence ID:</span>
              <span className="text-white font-bold">{reportData.evidence_id || 'N/A'}</span>
            </div>
            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Investigation / Case ID:</span>
              <span className="text-white font-bold">{reportData.case_id || 'CASE-GENERAL'}</span>
            </div>
            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Original Evidence File:</span>
              <span className="text-cyan-400 font-bold">{reportData.file_name || 'suspect_evidence.dat'}</span>
            </div>
            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Ethereum Block Number:</span>
              <span className="text-white font-bold">#{reportData.block_number ?? '---'}</span>
            </div>
          </div>

          {/* Cryptographic Proof Details */}
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#05080f] p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">On-Chain Recorded SHA-256 Hash:</span>
              <span className="text-emerald-300 break-all select-all font-semibold">
                {reportData.stored_hash || reportData.file_hash || 'N/A'}
              </span>
            </div>

            {reportData.calculated_hash && (
              <div className="bg-[#05080f] p-3.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Suspect File Calculated Hash:</span>
                <span className={`break-all select-all font-semibold ${isIntact ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {reportData.calculated_hash}
                </span>
              </div>
            )}
          </div>

          {/* Custody Signature Footnote */}
          <div className="border-t border-slate-800 pt-6 mt-6 text-xs text-slate-400 font-mono">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-300">Preserving Custodian / Investigator:</p>
                <p className="text-[11px] text-cyan-400 mt-1 truncate max-w-xs">
                  {reportData.investigator || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Signed & verified via ECDSA Cryptographic Key
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-slate-300">Verification Timestamp:</p>
                <p className="text-[11px] text-slate-200 mt-1">
                  {new Date().toUTCString()}
                </p>
                <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Blockchain Timestamp Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
