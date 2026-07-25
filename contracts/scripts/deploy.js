const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying InsurancePolicyNFT with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const Contract = await ethers.getContractFactory("InsurancePolicyNFT");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("InsurancePolicyNFT deployed to:", address);

  const deployment = {
    network: "sepolia",
    chainId: 11155111,
    contractAddress: address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: Contract.interface.format("json"),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "sepolia.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log("Deployment saved to", outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
