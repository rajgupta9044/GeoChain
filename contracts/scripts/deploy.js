const hre = require('hardhat');
async function main() {
  if (!process.env.BLOCKCHAIN_RPC_URL) throw new Error('BLOCKCHAIN_RPC_URL is missing in the project-root .env file');
  if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY is missing in the project-root .env file');
  const [admin] = await hre.ethers.getSigners();
  const Registry = await hre.ethers.getContractFactory('GeoDataRegistry');
  const registry = await Registry.deploy(admin.address);
  await registry.waitForDeployment();
  console.log(`CONTRACT_ADDRESS=${await registry.getAddress()}`);
  console.log(`BLOCKCHAIN_NETWORK=${hre.network.name}`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
