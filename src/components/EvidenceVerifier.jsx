import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, FileSearch, ArrowRight, 
  Upload, Check, AlertTriangle, FileText, Printer, RefreshCw, Lock, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { web3Service } from '../services/web3Service';

export default function EvidenceVerifier({ 
  initialEvidenceId = '', 
  initialHash = '', 
  evidences = [],
  onOpenReport
}) {
  const [evidenceId, setEvidenceId] = useState(initialEvidenceId);
  const [suspectFile, setSuspectFile] = useState(null);
  const [suspectHash, setSuspectHash] = useState(initialHash);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [verificationReport, setVerificationReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync initial props
  useEffect(() => {
    if (initialEvidenceId) setEvidenceId(initialEvidenceId);
    if (initialHash) setSuspectHash(initialHash);
  }, [initialEvidenceId, initialHash]);

  // Handle suspect file upload
  const handleSuspectFileChange = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setVerificationReport(null);
    setSuspectFile(file);

    setIsHashing(true);
    try {
      const hash = await web3Service.calculateSHA256InBrowser(file);
      setSuspectHash(hash);
    } catch (err) {
      console.error('Browser hash failed, using backend:', err);
      try {
        const res = await api.calculateHash(file);
        setSuspectHash(res.file_hash);
      } catch (backendErr) {
        setErrorMsg('Error computing hash: ' + backendErr.message);
      }
    } finally {
      setIsHashing(false);
    }
  };

  // Run integrity verification query
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setVerificationReport(null);

    if (!suspectHash && !suspectFile) {
      setErrorMsg('Please upload a suspect evidence file or enter its SHA-256 hash.');
      return;
    }

    setIsVerifying(true);
    try {
      let report = null;

      if (suspectFile) {
        // Direct file verification endpoint
        report = await api.verifySuspectFile(suspectFile, evidenceId);
      } else {
        // Verification by ID and Hash
        report = await api.verifyIntegrity(evidenceId, suspectHash);
      }

      setVerificationReport(report);
    } catch (err) {
      console.error('Verification failed:', err);
      setErrorMsg(err.message || 'Evidence verification failed against Ethereum ledger.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper to highlight differences between two hashes
  const renderHashDiff = (stored, current) => {
    if (!stored || !current || stored === current) {
      return (
        <span className="text-emerald-400 font-mono break-all">{current}</span>
      );
    }

    return (
      <div className="font-mono text-xs break-all">
        {current.split('').map((char, index) => {
          const isDiff = char !== stored[index];
          return (
            <span
              key={index}
              className={isDiff ? 'bg-rose-500 text-white font-bold px-0.5 rounded' : 'text-slate-300'}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-cyan-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-cyan-950/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
          <FileSearch className="w-4 h-4" />
          <span>Step 4 & 5: Forensic Integrity Verification</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Verify Digital Evidence Integrity
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Compare the cryptographic SHA-256 hash of a suspect or disputed evidence file against the immutable baseline recorded 
          on the Ethereum blockchain. Instantly detect if even a single byte has been altered or tampered with.
        </p>
      </div>

      {/* Verification Query Card */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suspect File Ingestion */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 font-mono flex items-center justify-between">
                <span>Suspect Evidence File:</span>
                <span className="text-[11px] text-cyan-400">Drag & Drop or Select</span>
              </label>

              <div 
                onClick={() => document.getElementById('suspectFileInput')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  suspectFile ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <input 
                  id="suspectFileInput"
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleSuspectFileChange(e.target.files?.[0])}
                />
                <Upload className="w-7 h-7 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-200">
                  {suspectFile ? suspectFile.name : 'Select or drop suspect evidence file here'}
                </p>
                {suspectFile && (
                  <p className="text-[11px] text-cyan-300 font-mono mt-1">
                    {(suspectFile.size / 1024).toFixed(2)} KB &bull; {suspectFile.type || 'binary'}
                  </p>
                )}
              </div>
            </div>

            {/* Target Evidence Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 font-mono">
                  Select Anchored Evidence ID (or enter manually):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(e.target.value)}
                    placeholder="e.g. EVID-2026-PCAP-001 (or leave blank for reverse lookup)"
                    className="flex-1 bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                  {evidences.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = evidences.find(ev => ev.evidence_id === e.target.value);
                        if (selected) {
                          setEvidenceId(selected.evidence_id);
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 text-xs text-slate-300 font-mono focus:outline-none"
                    >
                      <option value="">Quick Select</option>
                      {evidences.map(ev => (
                        <option key={ev.evidence_id} value={ev.evidence_id}>
                          {ev.evidence_id} ({ev.file_name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 font-mono">
                  Suspect SHA-256 Hash (Computed Automatically):
                </label>
                <input
                  type="text"
                  value={suspectHash}
                  onChange={(e) => setSuspectHash(e.target.value)}
                  placeholder="Computed SHA-256 (64 hex characters)"
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isVerifying || isHashing || (!suspectHash && !suspectFile)}
              className={`py-3 px-6 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all shadow-lg ${
                isVerifying || isHashing || (!suspectHash && !suspectFile)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white glow-emerald'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Querying Ethereum Smart Contract Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Blockchain Integrity Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* VERIFICATION REPORT SECTION */}
      {verificationReport && (
        <div className={`rounded-2xl p-6 border transition-all animate-fadeIn ${
          verificationReport.is_valid
            ? 'border-emerald-500/50 bg-emerald-950/20 glow-emerald'
            : 'border-rose-500/50 bg-rose-950/20 glow-rose'
        }`}>
          {/* Status Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-800">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl border ${
                verificationReport.is_valid
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-bounce'
              }`}>
                {verificationReport.is_valid ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <ShieldAlert className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
                    verificationReport.is_valid
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {verificationReport.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Case: {verificationReport.case_id || 'CYBER-CASE'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {verificationReport.is_valid
                    ? 'Verified — Hashes Match (Integrity Preserved)'
                    : 'Tampering Detected — Hashes Differ (Evidence Compromised)'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {verificationReport.is_valid
                    ? 'The current cryptographic fingerprint precisely equals the immutable record anchored in the Ethereum blockchain. Evidence is pristine and court-admissible.'
                    : 'CRITICAL ALERT: The calculated hash diverges from the blockchain baseline. One or more bytes have been modified, corrupted, or injected!'}
                </p>
              </div>
            </div>

            {/* Certificate Button */}
            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(verificationReport)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all flex-shrink-0"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>View Forensic Certificate</span>
              </button>
            )}
          </div>

          {/* Cryptographic Hash Comparison Grid */}
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
              Cryptographic Hash Comparison Proof:
            </h4>

            {/* Blockchain Stored Baseline */}
            <div className="bg-[#05080f] rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">1. Ethereum Blockchain Recorded Hash (Baseline):</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Anchored at Block #{verificationReport.block_number ?? '---'}
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-300 break-all select-all">
                {verificationReport.stored_hash || 'Record Not Found in Blockchain Storage'}
              </p>
            </div>

            {/* Suspect File Calculated Hash */}
            <div className={`rounded-xl p-4 border ${
              verificationReport.is_valid
                ? 'bg-[#05080f] border-slate-800'
                : 'bg-rose-950/30 border-rose-800/80'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">2. Suspect File SHA-256 (Calculated Now):</span>
                <span className={`font-bold text-xs ${verificationReport.is_valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {verificationReport.is_valid ? 'Exact Match' : 'Divergent / Tampered'}
                </span>
              </div>
              {renderHashDiff(verificationReport.stored_hash, verificationReport.calculated_hash)}
            </div>
          </div>

          {/* Forensic Metadata Footprint */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Evidence Record:</span>
              <span className="text-slate-200 font-bold truncate block">{verificationReport.evidence_id}</span>
            </div>

            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Evidence Filename:</span>
              <span className="text-cyan-400 font-bold truncate block">{verificationReport.file_name || 'evidence.dat'}</span>
            </div>

            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">First Anchored Timestamp:</span>
              <span className="text-slate-200 truncate block">
                {verificationReport.timestamp_iso ? new Date(verificationReport.timestamp_iso).toUTCString() : 'N/A'}
              </span>
            </div>

            <div className="bg-[#05080f] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Logging Investigator:</span>
              <span className="text-slate-200 truncate block" title={verificationReport.investigator}>
                {verificationReport.investigator || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
