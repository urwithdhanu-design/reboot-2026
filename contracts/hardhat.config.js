require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { ALCHEMY_RPC_URL, INSURER_MINT_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      url: ALCHEMY_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: INSURER_MINT_PRIVATE_KEY ? [INSURER_MINT_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: ".",
    artifacts: "artifacts",
  },
};
