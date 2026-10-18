const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying ForensicEvidenceTracker Smart Contract...");
  console.log("Network:", hre.network.name, "(ChainID:", hre.network.config.chainId || "unknown", ")");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const ForensicEvidenceTracker = await hre.ethers.getContractFactory("ForensicEvidenceTracker");
  const contract = await ForensicEvidenceTracker.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("ForensicEvidenceTracker deployed successfully to:", contractAddress);

  // Extract ABI from compiled artifacts
  let artifactPath = path.join(__dirname, "../artifacts/src/ForensicEvidenceTracker.sol/ForensicEvidenceTracker.json");
  if (!fs.existsSync(artifactPath)) {
    artifactPath = path.join(__dirname, "../artifacts/ForensicEvidenceTracker.sol/ForensicEvidenceTracker.json");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contractData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  // Export to Backend
  const backendDir = path.join(__dirname, "../../backend");
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendDir, "contract_info.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log("Exported contract info to: backend/contract_info.json");

  // Export to Frontend
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendContractsDir, "contract_info.json"),
    JSON.stringify(contractData, null, 2)
  );
  console.log("Exported contract info to: frontend/src/contracts/contract_info.json");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
