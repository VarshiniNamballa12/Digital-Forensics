// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ForensicEvidenceTracker
 * @dev Ethereum-Based Digital Forensics Evidence Management System
 * Provides immutable chain-of-custody, cryptographic SHA-256 fingerprinting,
 * and integrity verification for digital forensics evidence (PCAPs, logs, images, documents).
 */
contract ForensicEvidenceTracker {
    struct Evidence {
        string evidenceId;
        string fileHash; // SHA-256 hash (64 hex characters)
        string caseId;
        string fileName;
        string fileType;
        uint256 fileSize;
        string description;
        address investigator;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    // Mapping from Evidence ID to Evidence Record
    mapping(string => Evidence) private evidences;
    
    // Mapping from SHA-256 hash to Evidence ID (for quick reverse lookup)
    mapping(string => string) private hashToEvidenceId;

    // All evidence IDs for enumeration
    string[] private allEvidenceIds;

    // Contract Owner / Forensic Lab Admin
    address public immutable forensicAdmin;

    // Events
    event EvidenceStored(
        string indexed evidenceId,
        string indexed caseId,
        string fileHash,
        string fileName,
        uint256 fileSize,
        address indexed investigator,
        uint256 timestamp,
        uint256 blockNumber
    );

    event EvidenceVerified(
        string indexed evidenceId,
        string calculatedHash,
        bool indexed isMatch,
        address indexed verifier,
        uint256 timestamp
    );

    event TamperAlert(
        string indexed evidenceId,
        string originalHash,
        string tamperedHash,
        address indexed verifier,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == forensicAdmin, "Only forensic admin can perform this operation");
        _;
    }

    constructor() {
        forensicAdmin = msg.sender;
    }

    /**
     * @notice Records new digital forensic evidence on the Ethereum blockchain
     * @param _evidenceId Unique evidence identifier (e.g., EVID-2026-001)
     * @param _fileHash Cryptographic SHA-256 hash of the evidence file
     * @param _caseId Case file identifier (e.g., CASE-CRIME-882)
     * @param _fileName Name of original evidence file
     * @param _fileType MIME or file extension type (e.g., PCAP, LOG, PNG)
     * @param _fileSize Size of evidence file in bytes
     * @param _description Chain of custody notes or evidence description
     */
    function storeEvidence(
        string memory _evidenceId,
        string memory _fileHash,
        string memory _caseId,
        string memory _fileName,
        string memory _fileType,
        uint256 _fileSize,
        string memory _description
    ) public {
        require(bytes(_evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(_fileHash).length == 64, "File hash must be a valid 64-char SHA-256 string");
        require(!evidences[_evidenceId].exists, "Evidence with this ID already registered");

        Evidence memory newEvidence = Evidence({
            evidenceId: _evidenceId,
            fileHash: _fileHash,
            caseId: _caseId,
            fileName: _fileName,
            fileType: _fileType,
            fileSize: _fileSize,
            description: _description,
            investigator: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        evidences[_evidenceId] = newEvidence;
        hashToEvidenceId[_fileHash] = _evidenceId;
        allEvidenceIds.push(_evidenceId);

        emit EvidenceStored(
            _evidenceId,
            _caseId,
            _fileHash,
            _fileName,
            _fileSize,
            msg.sender,
            block.timestamp,
            block.number
        );
    }

    /**
     * @notice Verifies whether a provided SHA-256 hash matches the recorded evidence hash
     * @param _evidenceId The evidence record ID to verify against
     * @param _calculatedHash The SHA-256 hash calculated from the suspect file
     * @return isMatch True if current hash matches recorded blockchain hash
     * @return storedHash The original SHA-256 hash recorded at submission
     * @return timestamp Block timestamp when evidence was first recorded
     * @return investigator Address of investigator who logged the evidence
     * @return caseId Associated forensic case number
     * @return fileName Original evidence filename
     */
    function verifyEvidence(
        string memory _evidenceId,
        string memory _calculatedHash
    ) public returns (
        bool isMatch,
        string memory storedHash,
        uint256 timestamp,
        address investigator,
        string memory caseId,
        string memory fileName
    ) {
        require(evidences[_evidenceId].exists, "Evidence record not found");

        Evidence memory ev = evidences[_evidenceId];
        isMatch = (keccak256(bytes(ev.fileHash)) == keccak256(bytes(_calculatedHash)));

        emit EvidenceVerified(_evidenceId, _calculatedHash, isMatch, msg.sender, block.timestamp);

        if (!isMatch) {
            emit TamperAlert(_evidenceId, ev.fileHash, _calculatedHash, msg.sender, block.timestamp);
        }

        return (
            isMatch,
            ev.fileHash,
            ev.timestamp,
            ev.investigator,
            ev.caseId,
            ev.fileName
        );
    }

    /**
     * @notice Read-only view verification for pre-flight verification without gas cost
     */
    function checkIntegrity(
        string memory _evidenceId,
        string memory _calculatedHash
    ) public view returns (
        bool isMatch,
        string memory storedHash,
        uint256 timestamp,
        address investigator,
        string memory caseId,
        string memory fileName,
        uint256 blockNumber
    ) {
        require(evidences[_evidenceId].exists, "Evidence record not found");
        Evidence memory ev = evidences[_evidenceId];
        isMatch = (keccak256(bytes(ev.fileHash)) == keccak256(bytes(_calculatedHash)));

        return (
            isMatch,
            ev.fileHash,
            ev.timestamp,
            ev.investigator,
            ev.caseId,
            ev.fileName,
            ev.blockNumber
        );
    }

    /**
     * @notice Retrieves full evidence details by ID
     */
    function getEvidence(string memory _evidenceId)
        public
        view
        returns (
            string memory evidenceId,
            string memory fileHash,
            string memory caseId,
            string memory fileName,
            string memory fileType,
            uint256 fileSize,
            string memory description,
            address investigator,
            uint256 timestamp,
            uint256 blockNumber
        )
    {
        require(evidences[_evidenceId].exists, "Evidence record not found");
        Evidence memory ev = evidences[_evidenceId];

        return (
            ev.evidenceId,
            ev.fileHash,
            ev.caseId,
            ev.fileName,
            ev.fileType,
            ev.fileSize,
            ev.description,
            ev.investigator,
            ev.timestamp,
            ev.blockNumber
        );
    }

    /**
     * @notice Finds evidence ID by SHA-256 hash (Reverse Lookup)
     */
    function findEvidenceByHash(string memory _fileHash) public view returns (string memory) {
        return hashToEvidenceId[_fileHash];
    }

    /**
     * @notice Returns total number of registered evidence records
     */
    function getTotalEvidenceCount() public view returns (uint256) {
        return allEvidenceIds.length;
    }

    /**
     * @notice Returns all evidence IDs
     */
    function getAllEvidenceIds() public view returns (string[] memory) {
        return allEvidenceIds;
    }

    /**
     * @notice Check whether an evidence record exists
     */
    function evidenceExists(string memory _evidenceId) public view returns (bool) {
        return evidences[_evidenceId].exists;
    }
}
