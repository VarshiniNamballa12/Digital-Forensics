import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, Shield, ArrowRight, 
  Copy, Check, AlertCircle, FileUp, Sparkles, HardDrive, Lock 
} from 'lucide-react';
import { api } from '../services/api';
import { web3Service } from '../services/web3Service';

const SAMPLE_EVIDENCES = [
  {
    name: 'network_capture.pcap',
    type: 'application/vnd.tcpdump.pcap',
    caseId: 'CASE-2026-CYBER-09',
    desc: 'Full packet capture of lateral movement and C2 beaconing on port 8443',
    content: 'FORENSIC_SAMPLE_PCAP_DATA_BINARY_STREAM_PACKET_HEADER_ETH_IP_TCP',
  },
  {
    name: 'auth_audit.log',
    type: 'text/plain',
    caseId: 'CASE-2026-AUDIT-44',
    desc: 'Linux auditd authentication log demonstrating sudo privilege escalation attempt',
    content: 'Oct 18 03:15:10 srv-prod-db sudo: secops : TTY=pts/0 ; COMMAND=/bin/cat /etc/shadow',
  },
  {
    name: 'compromised_system.log',
    type: 'text/plain',
    caseId: 'CASE-2026-INCIDENT-01',
    desc: 'Memory injection triage log and Volatility malfind artifact summary',
    content: '[2026-10-18T01:11:00Z] ALERT: Malicious DLL injection detected in explorer.exe (PID: 3412)',
  },
  {
    name: 'confidential_case_brief.txt',
    type: 'text/plain',
    caseId: 'CASE-2026-BRIEF-99',
    desc: 'Digital forensics lead investigator case notes and evidence chain-of-custody brief',
    content: 'INCIDENT RESPONSE CASE BRIEF - Target: Core Financial Gateway - Lead: Det. Alex Vance',
  }
];

export default function EvidenceUploader({ onEvidenceRegistered, wallet, onConnectWallet, onNavigateToVerify }) {
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState('');
  const [caseId, setCaseId] = useState('CASE-2026-CYBER-09');
  const [evidenceId, setEvidenceId] = useState('');
  const [description, setDescription] = useState('');
  const [officerBadge, setOfficerBadge] = useState('INV-8842');
  const [submissionMode, setSubmissionMode] = useState('backend'); // 'backend' | 'metamask'
  
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg('');
    setSuccessResult(null);
    setFile(selectedFile);

    // Auto-generate evidence ID
    const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const generatedId = `EVID-2026-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
    setEvidenceId(generatedId);

    // Calculate SHA-256 hash
    setIsHashing(true);
    try {
      const calculatedHash = await web3Service.calculateSHA256InBrowser(selectedFile);
      setFileHash(calculatedHash);
    } catch (err) {
      console.error('Browser hashing error, falling back to backend:', err);
      try {
        const res = await api.calculateHash(selectedFile);
        setFileHash(res.file_hash);
      } catch (backendErr) {
        setErrorMsg('Failed to calculate SHA-256 hash: ' + backendErr.message);
      }
    } finally {
      setIsHashing(false);
    }
  };

  // Load a pre-configured realistic forensic sample file
  const handleLoadSample = async (sample) => {
    setErrorMsg('');
    setSuccessResult(null);
    const blob = new Blob([sample.content], { type: sample.type });
    const sampleFile = new File([blob], sample.name, { type: sample.type });
    
    setCaseId(sample.caseId);
    setDescription(sample.desc);
    await handleFileChange(sampleFile);
  };

  // Copy hash to clipboard
  const handleCopyHash = () => {
    if (!fileHash) return;
    navigator.clipboard.writeText(fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Submit Evidence to Blockchain
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessResult(null);

    if (!file && !fileHash) {
      setErrorMsg('Please select or drag an evidence file first.');
      return;
    }
    if (!caseId.trim()) {
      setErrorMsg('Please provide a Case ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result = null;

      if (submissionMode === 'metamask') {
        if (!wallet?.address) {
          throw new Error('MetaMask is not connected. Please connect your wallet or choose Backend Node mode.');
        }

        const tx = await web3Service.storeEvidenceMetaMask({
          evidenceId: evidenceId || `EVID-${Date.now()}`,
          fileHash,
          caseId,
          fileName: file ? file.name : 'manual_evidence.dat',
          fileType: file ? file.type || 'application/octet-stream' : 'application/octet-stream',
          fileSize: file ? file.size : 0,
          description: description || `Investigator badge: ${officerBadge}`,
        });

        result = {
          evidence_id: evidenceId,
          file_hash: fileHash,
          file_name: file ? file.name : 'manual_evidence.dat',
          case_id: caseId,
          blockchain: {
            transaction_hash: tx.transactionHash,
            block_number: tx.blockNumber,
            gas_used: tx.gasUsed,
            investigator: wallet.address,
            timestamp_iso: new Date().toISOString()
          }
        };
      } else {
        // Backend Node Web3.py submission
        const formData = new FormData();
        if (file) formData.append('file', file);
        formData.append('case_id', caseId);
        formData.append('evidence_id', evidenceId);
        formData.append('file_hash', fileHash);
        formData.append('file_name', file ? file.name : 'evidence.dat');
        formData.append('file_size', file ? file.size : 0);
        formData.append('file_type', file ? file.type : 'application/octet-stream');
        formData.append('description', `${description} [Officer: ${officerBadge}]`);
        formData.append('investigator_address', wallet?.address || 'Backend Custodian Node');

        result = await api.registerEvidence(formData);
      }

      setSuccessResult(result);
      if (onEvidenceRegistered) onEvidenceRegistered(result);
    } catch (err) {
      console.error('Evidence registration failed:', err);
      setErrorMsg(err.message || 'Evidence anchoring failed on Ethereum.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Step 1, 2 & 3: Evidence Ingestion & Cryptographic Anchoring</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Upload & Anchor Forensic Evidence
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Upload digital evidence (PCAPs, log files, disk screenshots, documents). The system calculates a unique 
              <span className="text-cyan-300 font-mono font-semibold"> SHA-256 fingerprint</span> and anchors the metadata 
              immutably onto the Ethereum blockchain smart contract.
            </p>
          </div>

          {/* Quick Sample Selector */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex-shrink-0">
            <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test Samples:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_EVIDENCES.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700 text-slate-300 transition-all"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drag & Drop Zone and Hash Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all cyber-card ${
              file ? 'border-cyan-500/60 bg-cyan-950/10' : 'border-slate-700 hover:border-cyan-500/40 hover:bg-slate-900/40'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`p-4 rounded-2xl ${file ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                {file ? <FileCheckIcon className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {file ? file.name : 'Click to browse or drag & drop evidence file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PCAP, auth logs, memory dumps, PNG/JPG screenshots, PDF reports
                </p>
              </div>
              {file && (
                <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                  <span>{(file.size / 1024).toFixed(2)} KB</span>
                  <span>&bull;</span>
                  <span>{file.type || 'raw binary'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint Display */}
          <div className="cyber-card p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5 font-semibold">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>SHA-256 Cryptographic Hash</span>
              </span>
              {fileHash && (
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="bg-[#05080f] rounded-xl p-3 border border-slate-800/80 font-mono text-xs break-all">
              {isHashing ? (
                <div className="flex items-center space-x-2 text-cyan-400 py-1">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Computing 256-bit SHA-256 integrity hash...</span>
                </div>
              ) : fileHash ? (
                <span className="text-cyan-300 font-medium selection:bg-cyan-500/40">
                  {fileHash}
                </span>
              ) : (
                <span className="text-slate-500 italic">
                  Upload an evidence file above to generate its unique SHA-256 fingerprint
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              This cryptographic hash acts as an unforgeable mathematical signature. Any byte alteration produces a completely divergent hash.
            </p>
          </div>
        </div>

        {/* Right Column: Evidence Registration Form & Blockchain Anchor */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmitEvidence} className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <span>Evidence Metadata & Chain of Custody</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Case ID / Investigation #</label>
                <input
                  type="text"
                  required
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g. CASE-2026-CYBER-09"
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Evidence ID (Unique Reference)</label>
                <input
                  type="text"
                  required
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  placeholder="e.g. EVID-2026-PCAP-001"
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Lead Investigator / Badge</label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  placeholder="e.g. Det. Alex Vance (IR-842)"
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Submission Mechanism</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubmissionMode('backend')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      submissionMode === 'backend'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Backend Web3.py
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionMode('metamask');
                      if (!wallet?.address && onConnectWallet) onConnectWallet();
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      submissionMode === 'metamask'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    MetaMask Wallet
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Forensic Chain of Custody Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include acquisition method, write-blocker serial number, workstation IP, or seizure context..."
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !fileHash}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center space-x-2 shadow-lg ${
                isSubmitting || !fileHash
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 glow-cyan'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Anchoring Evidence to Ethereum Blockchain...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Record Hash on Ethereum Smart Contract</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Card / Success Report */}
      {successResult && (
        <div className="border border-emerald-500/40 bg-emerald-950/20 rounded-2xl p-6 glow-emerald transition-all animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Blockchain Anchored
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Block #{successResult.blockchain?.block_number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Evidence Cryptographically Sealed on Ethereum Ledger
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigateToVerify && onNavigateToVerify(successResult.evidence_id, successResult.file_hash)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex-shrink-0"
            >
              <span>Verify This Record Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 font-mono text-xs">
            <div className="bg-[#05080f] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Evidence ID:</span>
              <span className="text-cyan-400 font-bold">{successResult.evidence_id}</span>
            </div>

            <div className="bg-[#05080f] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Case Number:</span>
              <span className="text-slate-200 font-bold">{successResult.case_id}</span>
            </div>

            <div className="bg-[#05080f] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Investigator Address:</span>
              <span className="text-slate-200 truncate block" title={successResult.blockchain?.investigator}>
                {successResult.blockchain?.investigator || 'Custodian Node'}
              </span>
            </div>
          </div>

          <div className="mt-3 bg-[#05080f] p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">Ethereum Transaction Hash:</span>
              <span className="text-[11px] text-emerald-400 font-semibold">Confirmed</span>
            </div>
            <span className="text-cyan-300 break-all select-all">
              {successResult.blockchain?.transaction_hash}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FileCheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
