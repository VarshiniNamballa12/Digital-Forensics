import React from 'react';
import { Database, ShieldCheck, Link2, FileCode2, Radio } from 'lucide-react';

export default function StatsOverview({ totalEvidences, networkStatus }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Evidences Card */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Anchored Evidences</p>
            <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-1">{totalEvidences ?? 0}</h3>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Immutable records on Ethereum
        </p>
      </div>

      {/* Cryptographic Algorithm */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Integrity Fingerprint</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">SHA-256</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 256-bit cryptographic digest
        </p>
      </div>

      {/* Smart Contract Ledger */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Smart Contract</p>
            <h3 className="text-sm font-bold font-mono text-slate-200 mt-2 truncate max-w-[150px]">
              {networkStatus?.contract_address 
                ? `${networkStatus.contract_address.slice(0, 6)}...${networkStatus.contract_address.slice(-4)}`
                : 'Not Deployed'}
            </h3>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <FileCode2 className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Solidity 0.8.20 EVM
        </p>
      </div>

      {/* Network Node Status */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Blockchain Node</p>
            <h3 className="text-lg font-bold font-mono text-amber-400 mt-1 flex items-center gap-2">
              <Radio className={`w-4 h-4 ${networkStatus?.connected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              {networkStatus?.connected ? 'Connected' : 'Sync Waiting'}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Link2 className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
          Block #{networkStatus?.block_number ?? 0} &bull; Chain {networkStatus?.chain_id ?? '---'}
        </p>
      </div>
    </div>
  );
}
