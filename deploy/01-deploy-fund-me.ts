import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import deployMocks from "./00-deploy-mocks";
import verify from "../utils/verify";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let ethUsdPriceFeedAddress;

  log("chainId: ", chainId);
  log("network.name: ", network.name);

  // chainId === "31337"
  if (chainId && developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed;
  }
  log("-------------------------------------------");

  log("ethUsdPriceFeedAddress: ", ethUsdPriceFeedAddress);

  const contractConstructorArguments = [ethUsdPriceFeedAddress];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: contractConstructorArguments, // constructor arguments
    log: true,
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, contractConstructorArguments);
  }

  log("-------------------------------------------");
};

export default func;
deployMocks.tags = ["all", "fundMe"];
