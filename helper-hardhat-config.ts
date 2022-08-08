export interface NetworkConfigItem {
  ethUsdPriceFeed?: string;
  blockConfirmations?: number;
}

export interface NetworkConfigInfo {
  [key: string]: NetworkConfigItem;
}

export const networkConfig: NetworkConfigInfo = {
  localhost: {},
  hardhat: {},
  rinkeby: {
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    blockConfirmations: 6,
  },
  polygon: {
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
};

export const developmentChains = ["hardhat", "localhost"];

export const DECIMALS = "18";
export const INITIAL_PRICE = "2000000000000000000000"; // 2000
