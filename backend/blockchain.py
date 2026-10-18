import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from web3 import Web3
from web3.exceptions import Web3Exception
from config import Config

logger = logging.getLogger(__name__)

class BlockchainClient:
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.contract_address = None
        self.contract_abi = None
        self.operator_account = None
        self.initialize_connection()

    def initialize_connection(self):
        """Initializes connection to the Ethereum node and loads the smart contract."""
        try:
            self.w3 = Web3(Web3.HTTPProvider(Config.ETHEREUM_RPC_URL))
            
            # Load operator account if private key provided
            if Config.OPERATOR_PRIVATE_KEY:
                try:
                    self.operator_account = self.w3.eth.account.from_key(Config.OPERATOR_PRIVATE_KEY)
                except Exception as e:
                    logger.warning(f"Failed to load operator private key: {e}")

            # Load contract ABI & address
            self.load_contract()
        except Exception as e:
            logger.error(f"Error initializing Web3 connection: {e}")

    def load_contract(self):
        """Loads contract ABI and address from contract_info.json or config."""
        contract_info_file = Config.CONTRACT_INFO_PATH
        if contract_info_file.exists():
            try:
                with open(contract_info_file, "r") as f:
                    data = json.load(f)
                    self.contract_address = Web3.to_checksum_address(data.get("address"))
                    self.contract_abi = data.get("abi")
            except Exception as e:
                logger.error(f"Could not load contract_info.json: {e}")

        if not self.contract_address and Config.CONTRACT_ADDRESS:
            self.contract_address = Web3.to_checksum_address(Config.CONTRACT_ADDRESS)

        if self.w3 and self.w3.is_connected() and self.contract_address and self.contract_abi:
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
            logger.info(f"Loaded contract at {self.contract_address}")

    def is_connected(self) -> bool:
        """Returns True if connected to an active Ethereum node."""
        try:
            return self.w3 is not None and self.w3.is_connected()
        except Exception:
            return False

    def get_network_status(self) -> dict:
        """Retrieves real-time blockchain network diagnostics."""
        connected = self.is_connected()
        if not connected:
            return {
                "connected": False,
                "rpc_url": Config.ETHEREUM_RPC_URL,
                "chain_id": None,
                "block_number": None,
                "contract_deployed": bool(self.contract),
                "contract_address": self.contract_address,
                "operator_address": self.operator_account.address if self.operator_account else None,
                "message": "Ethereum node is not reachable. Ensure Hardhat node or Sepolia RPC is active."
            }

        try:
            chain_id = self.w3.eth.chain_id
            latest_block = self.w3.eth.block_number
            operator_balance = 0
            if self.operator_account:
                balance_wei = self.w3.eth.get_balance(self.operator_account.address)
                operator_balance = float(self.w3.from_wei(balance_wei, 'ether'))

            return {
                "connected": True,
                "rpc_url": Config.ETHEREUM_RPC_URL,
                "chain_id": chain_id,
                "block_number": latest_block,
                "contract_deployed": bool(self.contract),
                "contract_address": self.contract_address,
                "operator_address": self.operator_account.address if self.operator_account else None,
                "operator_balance_eth": operator_balance,
                "network_name": "Sepolia Testnet" if chain_id == 11155111 else ("Hardhat Local Node" if chain_id == 31337 else f"EVM Chain #{chain_id}")
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "contract_deployed": False
            }

    def record_evidence(
        self,
        evidence_id: str,
        file_hash: str,
        case_id: str,
        file_name: str,
        file_type: str,
        file_size: int,
        description: str,
        sender_private_key: str = None
    ) -> dict:
        """
        Executes a smart contract transaction to store evidence metadata on Ethereum.
        """
        if not self.contract:
            raise RuntimeError("Smart contract is not loaded or Ethereum node is unavailable")

        account = None
        if sender_private_key:
            account = self.w3.eth.account.from_key(sender_private_key)
        elif self.operator_account:
            account = self.operator_account
        else:
            raise RuntimeError("No operator account or private key provided to sign transaction")

        nonce = self.w3.eth.get_transaction_count(account.address, 'pending')
        gas_price = self.w3.eth.gas_price

        # Build transaction
        tx = self.contract.functions.storeEvidence(
            evidence_id,
            file_hash,
            case_id,
            file_name,
            file_type,
            int(file_size),
            description
        ).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gasPrice': gas_price,
            'chainId': self.w3.eth.chain_id
        })

        # Estimate gas
        try:
            estimated_gas = self.w3.eth.estimate_gas(tx)
            tx['gas'] = int(estimated_gas * 1.2)  # 20% buffer
        except Exception:
            tx['gas'] = 450000

        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        # Get block timestamp
        block = self.w3.eth.get_block(receipt.blockNumber)
        timestamp = block.timestamp
        iso_timestamp = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()

        return {
            "success": receipt.status == 1,
            "transaction_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "evidence_id": evidence_id,
            "file_hash": file_hash,
            "timestamp": timestamp,
            "timestamp_iso": iso_timestamp,
            "investigator": account.address
        }

    def verify_evidence_integrity(self, evidence_id: str, calculated_hash: str) -> dict:
        """
        Queries smart contract to check whether calculated hash matches stored on-chain hash.
        """
        if not self.contract:
            raise RuntimeError("Smart contract is not loaded or Ethereum node is unavailable")

        # Call checkIntegrity view function
        res = self.contract.functions.checkIntegrity(evidence_id, calculated_hash).call()
        is_match = res[0]
        stored_hash = res[1]
        stored_timestamp = res[2]
        investigator = res[3]
        case_id = res[4]
        file_name = res[5]
        block_number = res[6]

        iso_timestamp = datetime.fromtimestamp(stored_timestamp, tz=timezone.utc).isoformat()

        return {
            "evidence_id": evidence_id,
            "is_valid": is_match,
            "status": "Verified — hashes match" if is_match else "Tampering detected — hashes differ",
            "calculated_hash": calculated_hash,
            "stored_hash": stored_hash,
            "case_id": case_id,
            "file_name": file_name,
            "investigator": investigator,
            "timestamp": stored_timestamp,
            "timestamp_iso": iso_timestamp,
            "block_number": block_number,
            "hashes_match": is_match
        }

    def get_evidence_details(self, evidence_id: str) -> dict:
        """Retrieves raw evidence record from blockchain."""
        if not self.contract:
            raise RuntimeError("Smart contract is not loaded")

        res = self.contract.functions.getEvidence(evidence_id).call()
        iso_timestamp = datetime.fromtimestamp(res[8], tz=timezone.utc).isoformat()

        return {
            "evidence_id": res[0],
            "file_hash": res[1],
            "case_id": res[2],
            "file_name": res[3],
            "file_type": res[4],
            "file_size": res[5],
            "description": res[6],
            "investigator": res[7],
            "timestamp": res[8],
            "timestamp_iso": iso_timestamp,
            "block_number": res[9]
        }

    def get_all_evidences(self) -> list:
        """Retrieves all registered evidence records from the blockchain."""
        if not self.contract:
            return []

        ids = self.contract.functions.getAllEvidenceIds().call()
        records = []
        for eid in ids:
            try:
                records.append(self.get_evidence_details(eid))
            except Exception as e:
                logger.error(f"Error fetching evidence {eid}: {e}")
        return records

    def find_by_hash(self, file_hash: str) -> str:
        """Performs reverse lookup for evidence record matching SHA-256 hash."""
        if not self.contract:
            return ""
        return self.contract.functions.findEvidenceByHash(file_hash).call()

# Global Singleton instance
blockchain_client = BlockchainClient()
