require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require('@nomiclabs/hardhat-ethers');

const privateKey = process.env.PRIVATE_KEY || "";

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      }
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [privateKey],
    },
    sepolia: {
      url: `https://mainnet.infura.io/v3/34bb02eef47a4ef3b0a16131df728a06`,
      accounts: [privateKey],
    }
  },
  solidity: {
    version: "0.5.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};