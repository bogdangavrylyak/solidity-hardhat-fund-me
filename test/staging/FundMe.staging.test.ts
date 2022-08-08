import { network, ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      const sendValue = ethers.utils.parseEther("0.1"); // 1 eth = 1000000000000000000
      let fundMe: FundMe;
      let deployer: SignerWithAddress;

      beforeEach(async () => {
        [deployer] = await ethers.getSigners();

        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
