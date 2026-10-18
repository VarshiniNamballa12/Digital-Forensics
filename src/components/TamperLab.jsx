import React, { useState } from 'react';
import { 
  AlertTriangle, Flame, ShieldAlert, CheckCircle2, 
  ArrowRight, RefreshCw, Zap, ShieldCheck, Binary 
} from 'lucide-react';
import { api } from '../services/api';
import { web3Service } from '../services/web3Service';

export default function TamperLab({ evidences = [], onTamperVerified }) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [originalHash, setOriginalHash] = useState('');
  const [tamperedText, setTamperedText] = useState('Oct 18 03:15:10 srv-prod-db sudo: secops : COMMAND=/bin/cat /etc/shadow');
  const [computedTamperedHash, setComputedTamperedHash] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // When evidence is selected from ledger
  const handleSelectEvidence = (evId) => {
    setSelectedEvidenceId(evId);
    setTestResult(null);
    const ev = evidences.find((e) => e.evidence_id === evId);
    if (ev) {
      setOriginalHash(ev.file_hash);
      // Create a tampered variant
      const modifiedHash = ev.file_hash.slice(0, -2) + (ev.file_hash.slice(-2) === 'aa' ? 'bb' : 'aa');
      setComputedTamperedHash(modifiedHash);
    }
  };

  // Mutate text slightly
  const handleMutate = async (mutationType) => {
    let newText = tamperedText;
    if (mutationType === 'byte') {
      newText = tamperedText + ' '; // Added single invisible space
    } else if (mutationType === 'inject') {
      newText = tamperedText.replace('secops', 'attacker_root');
    } else if (mutationType === 'timestamp') {
      newText = tamperedText.replace('03:15:10', '03:15:11'); // 1 second alter
    }
    setTamperedText(newText);

    // Compute hash
    const blob = new Blob([newText], { type: 'text/plain' });
    const newHash = await web3Service.calculateSHA256InBrowser(blob);
    setComputedTamperedHash(newHash);
    setTestResult(null);
  };

  // Run backend / smart contract tamper test
  const handleRunTamperCheck = async () => {
    if (!selectedEvidenceId && evidences.length > 0) {
      setSelectedEvidenceId(evidences[0].evidence_id);
    }
    const targetId = selectedEvidenceId || (evidences[0]?.evidence_id ?? 'EVID-DEMO-01');

    setIsRunning(true);
    setTestResult(null);
    try {
      const res = await api.demonstrateTampering(targetId);
      setTestResult(res);
      if (onTamperVerified) onTamperVerified(res);
    } catch (err) {
      console.error('Tamper check error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-orange-950/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Forensic Lab: Cryptographic Avalanche & Tamper Detection</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Evidence Tampering Simulation Lab
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Observe how the <span className="text-cyan-300 font-mono">Avalanche Effect</span> in SHA-256 causes even a 1-bit or 
          1-character modification in evidence to radically change the cryptographic hash, triggering an immediate 
          tamper alert from the Ethereum smart contract.
        </p>
      </div>

      {/* Interactive Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mutation Console */}
        <div className="lg:col-span-7 cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Evidence Modification Chamber</span>
            </h3>

            {evidences.length > 0 && (
              <select
                value={selectedEvidenceId}
                onChange={(e) => handleSelectEvidence(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
              >
                <option value="">Select Target Evidence ID</option>
                {evidences.map((e) => (
                  <option key={e.evidence_id} value={e.evidence_id}>
                    {e.evidence_id} ({e.file_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">
              Suspect Evidence Content (Editable):
            </label>
            <textarea
              rows={4}
              value={tamperedText}
              onChange={async (e) => {
                const val = e.target.value;
                setTamperedText(val);
                const blob = new Blob([val], { type: 'text/plain' });
                const newHash = await web3Service.calculateSHA256InBrowser(blob);
                setComputedTamperedHash(newHash);
              }}
              className="w-full bg-[#05080f] border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Quick Mutator Actions */}
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-2 font-medium">
              Simulate Forensic Alterations:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleMutate('byte')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-all"
              >
                + Append 1 Byte (Space)
              </button>
              <button
                type="button"
                onClick={() => handleMutate('timestamp')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-all"
              >
                Altered Timestamp (03:15:11)
              </button>
              <button
                type="button"
                onClick={() => handleMutate('inject')}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-mono text-rose-300 border border-rose-500/40 transition-all"
              >
                Inject Malicious Attacker String
              </button>
            </div>
          </div>

          {/* New Hash Display */}
          <div className="bg-[#05080f] rounded-xl p-3 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block mb-1">New Altered SHA-256 Fingerprint:</span>
            <span className="text-rose-400 font-bold break-all">
              {computedTamperedHash || 'f9c2d1b09817...'}
            </span>
          </div>

          <button
            onClick={handleRunTamperCheck}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg glow-rose transition-all"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Smart Contract Verification in Progress...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Verify Altered Evidence on Ethereum</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right: Explanation & Real-Time Verdict */}
        <div className="lg:col-span-5 space-y-4">
          <div className="cyber-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Why Tampering is Cryptographically Impossible</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Ethereum's blockchain is an immutable distributed state machine. Once the original evidence SHA-256 digest is confirmed 
              in block transactions, it can never be rewritten or reordered.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Pre-image resistance (Impossible to reverse)</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Collision resistance (No two files share a hash)</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Solidity smart contract checkIntegrity enforces 100% bit parity</span>
              </div>
            </div>
          </div>

          {/* Test Verdict Box */}
          {testResult && (
            <div className="p-5 rounded-2xl border border-rose-500/60 bg-rose-950/30 glow-rose animate-fadeIn">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                    Tampering Detected — Hashes Differ
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Smart Contract Tamper Alert Emitted!</h4>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="bg-[#05080f] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Original On-Chain Hash:</span>
                  <span className="text-emerald-400 break-all">{testResult.original_hash}</span>
                </div>
                <div className="bg-[#05080f] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Tampered Suspect Hash:</span>
                  <span className="text-rose-400 break-all">{testResult.tampered_hash}</span>
                </div>
              </div>

              <p className="text-[11px] text-rose-300 mt-3 italic">
                Courtroom Inadmissibility: The digital forensics integrity chain is broken. This artifact will be rejected in judicial proceedings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
