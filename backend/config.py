import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    # Flask settings
    SECRET_KEY = os.getenv("SECRET_KEY", "forensic-crypto-secret-key-2026")
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    MAX_CONTENT_LENGTH = 200 * 1024 * 1024  # 200 MB max file size for forensic artifacts

    # Ethereum Blockchain settings
    # Default is local Hardhat node, can be switched to Sepolia
    ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID = int(os.getenv("CHAIN_ID", "31337"))
    
    # Optional private key for backend-relayed transactions
    # (Hardhat default Account #0 private key provided for frictionless local dev)
    OPERATOR_PRIVATE_KEY = os.getenv(
        "OPERATOR_PRIVATE_KEY", 
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    )
    
    # Contract Address can be set in .env or dynamically read from contract_info.json
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    CONTRACT_INFO_PATH = BASE_DIR / "contract_info.json"

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
