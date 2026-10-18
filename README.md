# Ethereum-Based Digital Forensics Evidence Management System

An enterprise-grade, decentralized chain-of-custody platform designed for digital forensics investigators, cybersecurity incident response (DFIR) teams, and law enforcement agencies. The system anchors cryptographic fingerprints (SHA-256) of forensic artifacts directly onto the Ethereum blockchain, establishing mathematically tamper-proof, court-admissible evidence records.

---

## 📌 Problem Statement

Digital evidence—such as network packet captures (`.pcap`), Linux system authentication logs (`auth.log`), volatile memory dumps, screenshots, and forensic disk images—is fragile and susceptible to:
1. **Accidental Modification**: Metadata changes (timestamps, file sizes) caused by improper handling.
2. **Malicious Tampering**: Attackers or rogue insiders editing audit logs or scrubbing event trails.
3. **Disputed Authenticity**: Defense or prosecuting attorneys questioning the chain of custody in judicial proceedings.

### 🛡️ Solution
This system calculates a unique **SHA-256 cryptographic digest** for every piece of digital evidence upon collection. This hash, along with investigation metadata (Case ID, Evidence ID, timestamps, file size, MIME type, and investigator identity), is permanently anchored into an **Ethereum Smart Contract**. 

Investigators, judges, or independent auditors can later upload any suspect file to verify whether its current cryptographic hash matches the original baseline stored on Ethereum.

---

## 🔄 5-Step Operational Workflow

```
+----------------------------------------------------------------------------------------------------+
|                                    DFIR EVIDENCE LIFECYCLE                                         |
+----------------------------------------------------------------------------------------------------+
|  [Step 1] Upload Evidence          PCAP, log files, disk dumps, images, documents                  |
|          |                                                                                         |
|          v                                                                                         |
|  [Step 2] Generate SHA-256 Hash    Compute 256-bit cryptographic digest (avalanche effect)         |
|          |                                                                                         |
|          v                                                                                         |
|  [Step 3] Record on Ethereum       Solidity Smart Contract anchors hash, timestamp & metadata      |
|          |                                                                                         |
|          v                                                                                         |
|  [Step 4] Verify Integrity         Compare suspect file hash against immutable on-chain record     |
|          |                                                                                         |
|          v                                                                                         |
|  [Step 5] Display Verification     [✓] Verified — hashes match (Integrity Intact / Court Admissible)|
|           Report                   [✗] Tampering detected — hashes differ (Integrity Breached)     |
+----------------------------------------------------------------------------------------------------+
```

---

## 💻 Technology Stack

| Component | Technology | Role in System |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite + Tailwind CSS) | Responsive cyber forensic UI, drag-and-drop ingestion, hash calculator, verification modal |
| **Backend** | Python Flask | RESTful API, chunked SHA-256 streaming, evidence storage & Web3 orchestration |
| **Blockchain** | Ethereum (Hardhat Local / Sepolia) | Decentralized, immutable ledger recording evidence custody |
| **Smart Contracts** | Solidity (`^0.8.20`) | `ForensicEvidenceTracker.sol` managing access control, storage & tamper events |
| **Blockchain Connection** | Web3.py & Ethers.js v6 | Backend custodian node interaction & client-side MetaMask signing |
| **Integrity Verification** | SHA-256 (Web Crypto & hashlib) | 256-bit cryptographic collision-resistant integrity digest |
| **Wallet** | MetaMask | Investigator transaction signing & identity authentication |

---

## 📂 Project Structure

```
Digital Forensics/
├── contracts/                                # Solidity Smart Contracts & Hardhat
│   ├── src/
│   │   └── ForensicEvidenceTracker.sol      # Core custody tracking contract
│   ├── scripts/
│   │   └── deploy.js                        # Multi-network deployment script
│   ├── test/
│   │   └── ForensicEvidenceTracker.test.js  # Automated Chai/Mocha unit tests
│   ├── hardhat.config.js                    # Hardhat config (Localhost + Sepolia)
│   └── package.json
│
├── backend/                                  # Python Flask & Web3.py Backend
│   ├── app.py                               # RESTful API endpoints
│   ├── blockchain.py                        # Web3.py contract client wrapper
│   ├── evidence_hasher.py                   # Streamed SHA-256 hashing engine
│   ├── config.py                            # Environment & chain configuration
│   ├── contract_info.json                   # Deployed address & ABI (auto-synced)
│   ├── uploads/                             # Secure local evidence vault
│   └── requirements.txt
│
├── frontend/                                 # React.js Modern Forensic Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                   # Wallet connect, node status & tabs
│   │   │   ├── StatsOverview.jsx            # High-level metrics & block height
│   │   │   ├── EvidenceUploader.jsx         # Steps 1, 2, 3: Ingestion & anchoring
│   │   │   ├── EvidenceVerifier.jsx         # Steps 4 & 5: Integrity verification engine
│   │   │   ├── EvidenceLedger.jsx           # Searchable table of all on-chain evidence
│   │   │   ├── TamperLab.jsx                # Interactive tampering demonstration
│   │   │   └── ForensicReportModal.jsx      # Printable Courtroom Integrity Certificate
│   │   ├── services/
│   │   │   ├── api.js                       # Flask backend API service
│   │   │   └── web3Service.js               # MetaMask & Ethers.js integration
│   │   ├── contracts/
│   │   │   └── contract_info.json           # ABI & contract address
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── sample_evidence/                          # Real forensic files for instant testing
│   ├── network_capture.pcap                 # Binary PCAP packet capture
│   ├── auth_audit.log                       # Linux sudo / auth log
│   ├── compromised_system.log               # Memory injection triage report
│   └── confidential_case_brief.txt          # Incident response notes
│
├── run_all.bat                               # One-click Windows starter script
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ or v22+)
- **Python** (v3.10+ or v3.11+)
- **MetaMask Browser Extension** (Chrome, Firefox, Brave, Edge)

### Option A: One-Click Launch (Windows)
Double-click `run_all.bat` or run:
```powershell
.\run_all.bat
```
This automatically starts the local Hardhat node, deploys the smart contract, launches the Flask backend, starts Vite React, and opens `http://localhost:3000`.

---

### Option B: Manual Step-by-Step Launch

#### 1. Start Local Ethereum Blockchain Node
```bash
cd contracts
npm install
npx hardhat node
```
*Keep this terminal running. It creates a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.*

#### 2. Deploy Smart Contract
In a new terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*The script outputs the deployed address (e.g. `0x5FbDB2315678afecb367f032d93F642f64180aa3`) and updates `contract_info.json` in both backend and frontend.*

#### 3. Run Smart Contract Tests
Verify smart contract functionality:
```bash
cd contracts
npx hardhat test
```
*Runs all 5 unit tests verifying registration, duplicate prevention, verification, tamper alerts, and reverse lookups.*

#### 4. Start Python Flask Backend
In a new terminal:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://127.0.0.1:5000` with Web3.py connected to the Ethereum node.*

#### 5. Start React Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Access the user interface at `http://localhost:3000`.*

---

## 🦊 MetaMask Configuration

To connect MetaMask to the local Hardhat blockchain network:

1. Open MetaMask &rarr; Click the Network Dropdown &rarr; **Add Network** &rarr; **Add a network manually**:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
2. **Import Test Account**:
   - In MetaMask, click Account icon &rarr; **Import Account**.
   - Paste Hardhat Account #0 private key:
     ```
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```
   - You will instantly see 10,000 test ETH available to sign transactions!

---

## 🌐 Deploying to Ethereum Sepolia Testnet

To deploy on the live public Ethereum Sepolia testnet:

1. Create an Alchemy or Infura account and get your Sepolia RPC URL (e.g., `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`).
2. Get Sepolia testnet ETH from a faucet (e.g., [sepoliafaucet.com](https://sepoliafaucet.com) or [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)).
3. In `contracts/.env`:
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=0xYOUR_SEPOLIA_WALLET_PRIVATE_KEY
   ```
4. Run deployment:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
5. In `backend/.env`:
   ```env
   ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   CHAIN_ID=11155111
   CONTRACT_ADDRESS=0xYOUR_DEPLOYED_SEPOLIA_CONTRACT_ADDRESS
   ```

---

## 📜 Smart Contract Reference (`ForensicEvidenceTracker.sol`)

### Key Struct:
```solidity
struct Evidence {
    string evidenceId;       // Unique ID (e.g. EVID-2026-PCAP-001)
    string fileHash;         // 64-character SHA-256 digest
    string caseId;           // Case number (e.g. CASE-2026-CYBER-09)
    string fileName;         // Original file name
    string fileType;         // MIME type
    uint256 fileSize;        // Size in bytes
    string description;      // Custody notes
    address investigator;    // Signer / investigator wallet address
    uint256 timestamp;       // Block timestamp
    uint256 blockNumber;     // Block number
    bool exists;             // Record existence flag
}
```

### Main Functions:
- `storeEvidence(...)`: Records new digital evidence on-chain. Emits `EvidenceStored`.
- `verifyEvidence(evidenceId, calculatedHash)`: Compares calculated hash with stored hash. Emits `EvidenceVerified` and `TamperAlert` if mismatched.
- `checkIntegrity(evidenceId, calculatedHash)`: Gas-free view method for pre-flight integrity verification.
- `getEvidence(evidenceId)`: Returns full metadata record.
- `findEvidenceByHash(fileHash)`: Reverse lookup from SHA-256 hash to Evidence ID.
- `getAllEvidenceIds()`: Returns all registered evidence IDs.

---

## 📡 REST API Documentation

### 1. System & Blockchain Health
- **Endpoint**: `GET /api/status`
- **Response**:
  ```json
  {
    "status": "online",
    "blockchain": {
      "connected": true,
      "chain_id": 31337,
      "block_number": 3,
      "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "network_name": "Hardhat Local Node"
    }
  }
  ```

### 2. Generate SHA-256 Hash
- **Endpoint**: `POST /api/evidence/hash`
- **Body**: `multipart/form-data` with `file`

### 3. Record Evidence on Blockchain
- **Endpoint**: `POST /api/evidence/register`
- **Body**:
  - `file`: (binary file)
  - `case_id`: `"CASE-2026-CYBER-09"`
  - `evidence_id`: `"EVID-2026-PCAP-001"`
  - `description`: `"Packet trace intercepted on edge router"`
- **Response**: Confirmed Ethereum transaction receipt including `transaction_hash`, `block_number`, and `gas_used`.

### 4. Verify Evidence Integrity
- **Endpoint**: `POST /api/evidence/verify-file` or `POST /api/evidence/verify`
- **Output Verdict**:
  - `Verified — hashes match`: `{ "is_valid": true, "hashes_match": true, "status": "Verified — hashes match" }`
  - `Tampering detected — hashes differ`: `{ "is_valid": false, "hashes_match": false, "status": "Tampering detected — hashes differ" }`

### 5. Fetch Ledger
- **Endpoint**: `GET /api/evidence/list`

---

## 🧪 Forensic Tamper Demonstration

To see the system catch tampering in real-time:
1. Open `http://localhost:3000` &rarr; Go to **"4. Tamper Demo Lab"**.
2. Select an anchored evidence file (e.g. `auth_audit.log`).
3. Click **"Altered Timestamp"** or edit any character in the suspect box.
4. Notice how the SHA-256 hash immediately changes drastically (Avalanche Effect).
5. Click **"Verify Altered Evidence on Ethereum"**.
6. The system highlights the divergence in red, fires a **Tampering Detected — Hashes Differ** alert, and tags the evidence as court-inadmissible.

---

## 📄 License
MIT License - Created for Digital Forensics and Cyber Incident Response teams.
