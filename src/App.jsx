import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import EvidenceUploader from './components/EvidenceUploader';
import EvidenceVerifier from './components/EvidenceVerifier';
import EvidenceLedger from './components/EvidenceLedger';
import TamperLab from './components/TamperLab';
import ForensicReportModal from './components/ForensicReportModal';
import { api } from './services/api';
import { web3Service } from './services/web3Service';
import { AlertCircle, Shield, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [networkStatus, setNetworkStatus] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [isLoadingEvidences, setIsLoadingEvidences] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  
  // Verification target passed from Upload or Ledger
  const [verifyTarget, setVerifyTarget] = useState({ evidenceId: '', fileHash: '' });
  
  // Selected report modal data
  const [reportModalData, setReportModalData] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial status and evidences
  const refreshAll = async () => {
    try {
      const status = await api.getStatus();
      setNetworkStatus(status.blockchain);
    } catch (err) {
      console.warn('Backend status check failed:', err);
    }

    setIsLoadingEvidences(true);
    try {
      const listData = await api.getEvidenceList();
      setEvidences(listData.evidences || []);
    } catch (err) {
      console.warn('Could not load evidence list:', err);
    } finally {
      setIsLoadingEvidences(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Connect MetaMask
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const walletData = await web3Service.connectWallet();
      setWallet(walletData);
      showNotification(`Connected MetaMask: ${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`);
    } catch (err) {
      console.error('Wallet connection error:', err);
      showNotification(err.message, 'error');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // When an evidence is uploaded & anchored
  const handleEvidenceRegistered = (newRecord) => {
    showNotification(`Evidence ${newRecord.evidence_id} successfully recorded on Ethereum!`);
    refreshAll();
  };

  // Navigate to Verifier with preset evidence ID & hash
  const handleNavigateToVerify = (evidenceId, fileHash = '') => {
    setVerifyTarget({ evidenceId, fileHash });
    setActiveTab('verify');
  };

  // Simulate tamper navigation
  const handleSimulateTamper = (evidenceId) => {
    setActiveTab('tamperlab');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06090e] text-slate-100">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkStatus={networkStatus}
        wallet={wallet}
        isConnectingWallet={isConnectingWallet}
        onConnectWallet={handleConnectWallet}
        onRefreshStatus={refreshAll}
      />

      {/* Floating Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-mono shadow-2xl flex items-center space-x-2 animate-bounce ${
          notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Metrics Cards */}
        <StatsOverview
          totalEvidences={evidences.length}
          networkStatus={networkStatus}
        />

        {/* Tab 1: Upload & Anchor */}
        {activeTab === 'upload' && (
          <EvidenceUploader
            wallet={wallet}
            onConnectWallet={handleConnectWallet}
            onEvidenceRegistered={handleEvidenceRegistered}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {/* Tab 2: Verify Integrity */}
        {activeTab === 'verify' && (
          <EvidenceVerifier
            initialEvidenceId={verifyTarget.evidenceId}
            initialHash={verifyTarget.fileHash}
            evidences={evidences}
            onOpenReport={(report) => setReportModalData(report)}
          />
        )}

        {/* Tab 3: Evidence Ledger */}
        {activeTab === 'ledger' && (
          <EvidenceLedger
            evidences={evidences}
            isLoading={isLoadingEvidences}
            onRefresh={refreshAll}
            onVerifyEvidence={handleNavigateToVerify}
            onSimulateTamper={handleSimulateTamper}
            onOpenReport={(ev) => setReportModalData(ev)}
          />
        )}

        {/* Tab 4: Tamper Demo Lab */}
        {activeTab === 'tamperlab' && (
          <TamperLab
            evidences={evidences}
            onTamperVerified={(report) => {
              showNotification('Tamper alert logged! Hashes differ.', 'error');
            }}
          />
        )}
      </main>

      {/* Printable / Viewable Forensic Report Modal */}
      {reportModalData && (
        <ForensicReportModal
          reportData={reportModalData}
          onClose={() => setReportModalData(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#04060a] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Ethereum-Based Digital Forensics Evidence Management System</span>
          <span className="text-slate-600">
            Powered by Solidity &bull; Web3.py &bull; Flask &bull; React &bull; SHA-256
          </span>
        </div>
      </footer>
    </div>
  );
}
