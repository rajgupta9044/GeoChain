require('@nomicfoundation/hardhat-toolbox');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  solidity: '0.8.24',
  networks: {
    hardhat: {},
    sepolia: {
      // Hardhat requires a non-empty URL while loading the network config.
      // deploy.js performs the clearer configuration check before connecting.
      url: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  }
};
