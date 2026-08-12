const hre = require('hardhat');
async function main() {
  if (!process.env.BLOCKCHAIN_RPC_URL) throw new Error('BLOCKCHAIN_RPC_URL is missing in .env');
  if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY is missing in .env');
  if (!process.env.CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS is missing in .env');
  if (!process.env.PROVIDER_WALLET_ADDRESS) throw new Error('PROVIDER_WALLET_ADDRESS is missing in .env');
  const registry = await hre.ethers.getContractAt('GeoDataRegistry', process.env.CONTRACT_ADDRESS);
  const tx = await registry.grantProvider(process.env.PROVIDER_WALLET_ADDRESS);
  await tx.wait();
  console.log(`PROVIDER_GRANTED=${process.env.PROVIDER_WALLET_ADDRESS}`);
  console.log(`TRANSACTION_HASH=${tx.hash}`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
