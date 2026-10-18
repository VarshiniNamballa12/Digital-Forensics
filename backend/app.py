import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from evidence_hasher import EvidenceHasher
from blockchain import blockchain_client

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ForensicsBackend")

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ensure upload directory exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Keep an in-memory index of saved files for demonstration & integrity tests
LOCAL_FILE_REGISTRY = {}

@app.route("/api/status", methods=["GET"])
def get_system_status():
    """
    Returns the real-time status of backend services, SHA-256 engine,
    and Web3.py Ethereum blockchain connection.
    """
    # Refresh connection attempt if needed
    if not blockchain_client.is_connected() or not blockchain_client.contract:
        blockchain_client.initialize_connection()

    network_status = blockchain_client.get_network_status()
    return jsonify({
        "status": "online",
        "service": "Ethereum Digital Forensics Evidence Management System",
        "timestamp": datetime.utcnow().isoformat(),
        "blockchain": network_status,
        "hasher": "SHA-256 Engine Active"
    })

@app.route("/api/evidence/hash", methods=["POST"])
def calculate_file_hash():
    """
    Step 2: Generate SHA-256 hash
    Accepts an uploaded file or raw text and calculates its unique cryptographic fingerprint.
    """
    if 'file' not in request.files:
        # Check if text provided
        raw_text = request.form.get("text")
        if raw_text is not None:
            calculated_hash = EvidenceHasher.calculate_sha256(raw_text)
            return jsonify({
                "file_hash": calculated_hash,
                "file_size": len(raw_text.encode('utf-8')),
                "file_name": "raw_input.txt",
                "file_type": "text/plain"
            })
        return jsonify({"error": "No file or data uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename provided"}), 400

    file_name = secure_filename(file.filename)
    file_bytes = file.read()
    file_size = len(file_bytes)
    file_hash = EvidenceHasher.calculate_sha256(file_bytes)
    file_type = file.content_type or "application/octet-stream"

    return jsonify({
        "file_hash": file_hash,
        "file_name": file_name,
        "file_size": file_size,
        "file_type": file_type
    })

@app.route("/api/evidence/register", methods=["POST"])
def register_evidence():
    """
    Step 1 & 3: Investigator uploads evidence (PCAP, log file, image, document)
    Generates SHA-256 hash and records it directly on the Ethereum blockchain via Smart Contract.
    """
    try:
        # Extract form inputs
        case_id = request.form.get("case_id", "").strip()
        description = request.form.get("description", "").strip()
        custom_evidence_id = request.form.get("evidence_id", "").strip()
        provided_hash = request.form.get("file_hash", "").strip()
        investigator_address = request.form.get("investigator_address", "").strip()

        if not case_id:
            return jsonify({"error": "Case ID is required"}), 400

        # Handle file upload if present
        file_name = "evidence_record.dat"
        file_type = "application/octet-stream"
        file_size = 0
        calculated_hash = ""

        if 'file' in request.files and request.files['file'].filename != '':
            file = request.files['file']
            file_name = secure_filename(file.filename)
            file_type = file.content_type or "application/octet-stream"
            file_bytes = file.read()
            file_size = len(file_bytes)
            calculated_hash = EvidenceHasher.calculate_sha256(file_bytes)
            
            # Save file copy safely in evidence vault
            safe_storage_name = f"{uuid.uuid4().hex}_{file_name}"
            storage_path = Config.UPLOAD_FOLDER / safe_storage_name
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        elif provided_hash:
            calculated_hash = provided_hash
            file_name = request.form.get("file_name", "evidence_document")
            file_type = request.form.get("file_type", "document")
            file_size = int(request.form.get("file_size", 0))
        else:
            return jsonify({"error": "Either an evidence file or a valid SHA-256 hash must be provided"}), 400

        if not EvidenceHasher.is_valid_sha256(calculated_hash):
            return jsonify({"error": f"Invalid SHA-256 hash: {calculated_hash}"}), 400

        # Generate Evidence ID if not provided
        evidence_id = custom_evidence_id or f"EVID-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        # Record hash and metadata on Ethereum Blockchain
        tx_result = blockchain_client.record_evidence(
            evidence_id=evidence_id,
            file_hash=calculated_hash,
            case_id=case_id,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            description=description or f"Logged by {investigator_address or 'System Custodian'}"
        )

        LOCAL_FILE_REGISTRY[evidence_id] = {
            "evidence_id": evidence_id,
            "file_name": file_name,
            "stored_path": str(storage_path) if 'storage_path' in locals() else None,
            "file_hash": calculated_hash,
            "case_id": case_id
        }

        return jsonify({
            "message": "Evidence successfully anchored on Ethereum blockchain",
            "evidence_id": evidence_id,
            "file_hash": calculated_hash,
            "file_name": file_name,
            "file_size": file_size,
            "file_type": file_type,
            "case_id": case_id,
            "blockchain": tx_result
        }), 201

    except Exception as e:
        logger.error(f"Error registering evidence: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/api/evidence/verify", methods=["POST"])
def verify_evidence():
    """
    Step 4 & 5: Verify evidence integrity.
    Compares the calculated hash with the on-chain recorded hash.
    Outputs:
      - 'Verified — hashes match'
      - 'Tampering detected — hashes differ'
    """
    try:
        data = request.get_json(silent=True) or request.form.to_dict()
        evidence_id = data.get("evidence_id", "").strip()
        calculated_hash = data.get("file_hash", "").strip()

        # If user uploaded a suspect file directly in verification modal
        if 'file' in request.files and request.files['file'].filename != '':
            file = request.files['file']
            file_bytes = file.read()
            calculated_hash = EvidenceHasher.calculate_sha256(file_bytes)

        if not calculated_hash:
            return jsonify({"error": "No SHA-256 hash or file provided to verify"}), 400

        if not EvidenceHasher.is_valid_sha256(calculated_hash):
            return jsonify({"error": "Invalid SHA-256 format. Must be 64 hexadecimal characters"}), 400

        # If evidence_id not given, try to find it via reverse lookup
        if not evidence_id:
            matched_id = blockchain_client.find_by_hash(calculated_hash)
            if matched_id:
                evidence_id = matched_id
            else:
                return jsonify({
                    "is_valid": False,
                    "status": "Tampering detected — hashes differ",
                    "message": "Hash does not match any registered evidence record on the Ethereum ledger",
                    "calculated_hash": calculated_hash,
                    "stored_hash": "NOT_FOUND",
                    "hashes_match": False
                }), 200

        # Query blockchain smart contract
        verification_result = blockchain_client.verify_evidence_integrity(evidence_id, calculated_hash)
        return jsonify(verification_result)

    except Exception as e:
        logger.error(f"Error verifying evidence: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/api/evidence/verify-file", methods=["POST"])
def verify_file_upload():
    """
    Directly uploads a suspect forensic file and checks against an evidence ID or all records.
    """
    if 'file' not in request.files:
        return jsonify({"error": "File required for verification"}), 400

    file = request.files['file']
    evidence_id = request.form.get("evidence_id", "").strip()
    
    file_bytes = file.read()
    current_hash = EvidenceHasher.calculate_sha256(file_bytes)

    if not evidence_id:
        # Check reverse lookup
        evidence_id = blockchain_client.find_by_hash(current_hash)
        if not evidence_id:
            return jsonify({
                "is_valid": False,
                "status": "Tampering detected — hashes differ",
                "calculated_hash": current_hash,
                "stored_hash": None,
                "message": "File integrity unverified: No matching SHA-256 hash found on Ethereum blockchain.",
                "file_name": file.filename,
                "hashes_match": False
            }), 200

    result = blockchain_client.verify_evidence_integrity(evidence_id, current_hash)
    result["uploaded_file_name"] = file.filename
    return jsonify(result)

@app.route("/api/evidence/list", methods=["GET"])
def list_evidences():
    """Retrieves all registered forensic evidence records from the Ethereum blockchain."""
    try:
        evidences = blockchain_client.get_all_evidences()
        return jsonify({
            "count": len(evidences),
            "evidences": evidences
        })
    except Exception as e:
        logger.error(f"Error listing evidences: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/evidence/<evidence_id>", methods=["GET"])
def get_evidence(evidence_id):
    """Retrieves specific evidence metadata by ID."""
    try:
        details = blockchain_client.get_evidence_details(evidence_id)
        return jsonify(details)
    except Exception as e:
        return jsonify({"error": f"Evidence not found: {str(e)}"}), 404

@app.route("/api/evidence/tamper-demo", methods=["POST"])
def demonstrate_tampering():
    """
    Interactive demonstration tool:
    Takes an existing evidence ID or file, flips 1 bit or appends a character,
    generates the new altered hash, and tests verification against the smart contract.
    Proves that even a single byte change causes immediate tampering alert!
    """
    data = request.get_json(silent=True) or {}
    evidence_id = data.get("evidence_id")

    if not evidence_id:
        return jsonify({"error": "evidence_id is required"}), 400

    try:
        # Get original record
        original_record = blockchain_client.get_evidence_details(evidence_id)
        original_hash = original_record["file_hash"]

        # Simulate tamper: flip last hex char of hash, or append comment to file
        tampered_hash_list = list(original_hash)
        tampered_hash_list[-1] = '0' if tampered_hash_list[-1] != '0' else '1'
        tampered_hash = "".join(tampered_hash_list)

        # Run verification with tampered hash
        verification_report = blockchain_client.verify_evidence_integrity(evidence_id, tampered_hash)

        return jsonify({
            "evidence_id": evidence_id,
            "original_hash": original_hash,
            "tampered_hash": tampered_hash,
            "tamper_demonstration": True,
            "verification_report": verification_report
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[*] Starting Ethereum Forensic Evidence Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
