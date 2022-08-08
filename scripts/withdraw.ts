import { ethers, getNamedAccounts } from "hardhat";

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);

  console.log("Withdrawing from contract...");

  const txResponse = await fundMe.withdraw();
  await txResponse.wait(1);
  console.log("Withdraw finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
