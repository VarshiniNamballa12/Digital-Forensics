import React from 'react';
import { Shield, ShieldAlert, Cpu, Wallet, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  networkStatus,
  wallet,
  isConnectingWallet,
  onConnectWallet,
  onRefreshStatus,
}) {
  return (
    <header className="border-b border-slate-800 bg-[#070b12]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('upload')}>
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
              <Shield className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-wider text-lg text-white font-mono">ETH-FORENSIC</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SHA-256 Ledger
                </span>
              </div>
              <p className="text-xs text-slate-400">Digital Forensics Evidence Management System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {[
              { id: 'upload', label: '1. Upload & Anchor', icon: Cpu },
              { id: 'verify', label: '2. Verify Integrity', icon: Shield },
              { id: 'ledger', label: '3. Evidence Ledger', icon: CheckCircle2 },
              { id: 'tamperlab', label: '4. Tamper Demo Lab', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Blockchain & Wallet Status Bar */}
          <div className="flex items-center space-x-3">
            {/* Blockchain Network Badge */}
            <div
              onClick={onRefreshStatus}
              title="Click to refresh Ethereum node status"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                networkStatus?.connected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:border-rose-500/50'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  networkStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="font-mono text-[11px]">
                {networkStatus?.connected
                  ? `${networkStatus.network_name || 'Ethereum'} (Block #${networkStatus.block_number ?? '0'})`
                  : 'Node Offline'}
              </span>
              <RefreshCw className="w-3 h-3 text-slate-400 hover:text-white" />
            </div>

            {/* MetaMask Connect Button */}
            {wallet?.address ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-slate-200 text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span title={wallet.address}>
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
                <span className="text-[11px] text-cyan-400 font-semibold pl-1 border-l border-slate-700">
                  {wallet.balanceEth} ETH
                </span>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnectingWallet}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-medium shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnectingWallet ? 'Connecting...' : 'Connect MetaMask'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden space-x-1 pb-2 overflow-x-auto">
          {[
            { id: 'upload', label: '1. Upload' },
            { id: 'verify', label: '2. Verify' },
            { id: 'ledger', label: '3. Ledger' },
            { id: 'tamperlab', label: '4. Tamper Lab' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs whitespace-nowrap ${
                activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
