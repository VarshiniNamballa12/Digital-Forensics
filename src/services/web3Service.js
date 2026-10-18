import { ethers } from 'ethers';

import contractInfo from '../contracts/contract_info.json';

export const web3Service = {
  /**
   * Fast Client-Side SHA-256 computation using Web Crypto API
   */
  async calculateSHA256InBrowser(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Check if MetaMask extension is installed in browser
   */
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && Boolean(window.ethereum && window.ethereum.isMetaMask);
  },

  /**
   * Connect MetaMask wallet
   */
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask browser extension or use Backend Node mode.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const balanceWei = await provider.getBalance(accounts[0]);
    const balanceEth = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);

    return {
      address: accounts[0],
      chainId: Number(network.chainId),
      networkName: network.name === 'unknown' && Number(network.chainId) === 31337 
        ? 'Hardhat Localhost' 
        : (Number(network.chainId) === 11155111 ? 'Ethereum Sepolia' : network.name),
      balanceEth,
      signer,
      provider
    };
  },

  /**
   * Switch MetaMask to Hardhat Localhost or Sepolia
   */
  async switchNetwork(targetChainId = 31337) {
    if (!window.ethereum) return;
    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      // 4902 error indicates network needs to be added
      if (switchError.code === 4902 && targetChainId === 31337) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69', // 31337
              chainName: 'Hardhat Localhost Node',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545'],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  },

  /**
   * Get Contract instance for read/write
   */
  async getContract(needsSigner = false) {
    let contractAddress = contractInfo?.address || contractInfo?.default?.address;
    let contractAbi = contractInfo?.abi || contractInfo?.default?.abi;

    if (!contractAddress || !contractAbi) {
      // Try to fetch from backend if local import was empty
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.blockchain?.contract_address) {
          contractAddress = data.blockchain.contract_address;
        }
      } catch (err) {}
    }

    if (!contractAddress) {
      throw new Error('ForensicEvidenceTracker contract address not found. Please deploy the smart contract first.');
    }

    if (needsSigner) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(contractAddress, contractAbi, signer);
    } else {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(contractAddress, contractAbi, provider);
    }
  },

  /**
   * Store evidence directly on Ethereum using MetaMask
   */
  async storeEvidenceMetaMask({ evidenceId, fileHash, caseId, fileName, fileType, fileSize, description }) {
    const contract = await this.getContract(true);
    const tx = await contract.storeEvidence(
      evidenceId,
      fileHash,
      caseId,
      fileName,
      fileType,
      BigInt(fileSize),
      description
    );
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'Confirmed' : 'Failed'
    };
  }
};
