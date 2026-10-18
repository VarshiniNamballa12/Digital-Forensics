const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ForensicEvidenceTracker", function () {
  let tracker;
  let admin, investigator1, investigator2;

  const sampleEvidence = {
    id: "EVID-2026-PCAP-001",
    hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e", // 64 hex chars
    tamperedHash: "b591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146f",
    caseId: "CASE-CYBER-8812",
    fileName: "network_dump.pcap",
    fileType: "application/vnd.tcpdump.pcap",
    fileSize: 1048576, // 1 MB
    description: "Suspicious beaconing traffic intercepted from victim workstation",
  };

  beforeEach(async function () {
    [admin, investigator1, investigator2] = await ethers.getSigners();
    const ForensicEvidenceTracker = await ethers.getContractFactory("ForensicEvidenceTracker");
    tracker = await ForensicEvidenceTracker.deploy();
    await tracker.waitForDeployment();
  });

  it("Should store forensic evidence with proper metadata and events", async function () {
    const tx = await tracker.connect(investigator1).storeEvidence(
      sampleEvidence.id,
      sampleEvidence.hash,
      sampleEvidence.caseId,
      sampleEvidence.fileName,
      sampleEvidence.fileType,
      sampleEvidence.fileSize,
      sampleEvidence.description
    );

    await expect(tx)
      .to.emit(tracker, "EvidenceStored")
      .withArgs(
        sampleEvidence.id,
        sampleEvidence.caseId,
        sampleEvidence.hash,
        sampleEvidence.fileName,
        sampleEvidence.fileSize,
        investigator1.address,
        (val) => val > 0,
        (val) => val > 0
      );

    const record = await tracker.getEvidence(sampleEvidence.id);
    expect(record.evidenceId).to.equal(sampleEvidence.id);
    expect(record.fileHash).to.equal(sampleEvidence.hash);
    expect(record.caseId).to.equal(sampleEvidence.caseId);
    expect(record.fileName).to.equal(sampleEvidence.fileName);
    expect(record.fileSize).to.equal(sampleEvidence.fileSize);
    expect(record.investigator).to.equal(investigator1.address);
  });

  it("Should reject duplicate evidence ID registration", async function () {
    await tracker.connect(investigator1).storeEvidence(
      sampleEvidence.id,
      sampleEvidence.hash,
      sampleEvidence.caseId,
      sampleEvidence.fileName,
      sampleEvidence.fileType,
      sampleEvidence.fileSize,
      sampleEvidence.description
    );

    await expect(
      tracker.connect(investigator2).storeEvidence(
        sampleEvidence.id,
        sampleEvidence.hash,
        sampleEvidence.caseId,
        sampleEvidence.fileName,
        sampleEvidence.fileType,
        sampleEvidence.fileSize,
        "Duplicate attempt"
      )
    ).to.be.revertedWith("Evidence with this ID already registered");
  });

  it("Should verify intact evidence correctly (hashes match)", async function () {
    await tracker.connect(investigator1).storeEvidence(
      sampleEvidence.id,
      sampleEvidence.hash,
      sampleEvidence.caseId,
      sampleEvidence.fileName,
      sampleEvidence.fileType,
      sampleEvidence.fileSize,
      sampleEvidence.description
    );

    // Call state-changing verifyEvidence
    const tx = await tracker.connect(investigator2).verifyEvidence(sampleEvidence.id, sampleEvidence.hash);
    await expect(tx)
      .to.emit(tracker, "EvidenceVerified")
      .withArgs(sampleEvidence.id, sampleEvidence.hash, true, investigator2.address, (val) => val > 0);

    // Call view checkIntegrity
    const check = await tracker.checkIntegrity(sampleEvidence.id, sampleEvidence.hash);
    expect(check.isMatch).to.be.true;
    expect(check.storedHash).to.equal(sampleEvidence.hash);
  });

  it("Should detect tampering and emit TamperAlert when hash differs", async function () {
    await tracker.connect(investigator1).storeEvidence(
      sampleEvidence.id,
      sampleEvidence.hash,
      sampleEvidence.caseId,
      sampleEvidence.fileName,
      sampleEvidence.fileType,
      sampleEvidence.fileSize,
      sampleEvidence.description
    );

    // Call verifyEvidence with modified hash
    const tx = await tracker.connect(investigator2).verifyEvidence(sampleEvidence.id, sampleEvidence.tamperedHash);
    
    await expect(tx)
      .to.emit(tracker, "EvidenceVerified")
      .withArgs(sampleEvidence.id, sampleEvidence.tamperedHash, false, investigator2.address, (val) => val > 0);

    await expect(tx)
      .to.emit(tracker, "TamperAlert")
      .withArgs(sampleEvidence.id, sampleEvidence.hash, sampleEvidence.tamperedHash, investigator2.address, (val) => val > 0);

    // View check
    const check = await tracker.checkIntegrity(sampleEvidence.id, sampleEvidence.tamperedHash);
    expect(check.isMatch).to.be.false;
  });

  it("Should support reverse lookup of evidence ID by SHA-256 hash", async function () {
    await tracker.connect(investigator1).storeEvidence(
      sampleEvidence.id,
      sampleEvidence.hash,
      sampleEvidence.caseId,
      sampleEvidence.fileName,
      sampleEvidence.fileType,
      sampleEvidence.fileSize,
      sampleEvidence.description
    );

    const foundId = await tracker.findEvidenceByHash(sampleEvidence.hash);
    expect(foundId).to.equal(sampleEvidence.id);
  });
});
