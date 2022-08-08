import { network, ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { developmentChains } from "../../helper-hardhat-config";
import {
  FundMe,
  FundMe__factory,
  MockV3Aggregator,
} from "../../typechain-types";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      const sendValue = ethers.utils.parseEther("1"); // 1 eth = 1000000000000000000
      let fundMe: FundMe;
      let fundMeFactory: FundMe__factory;
      let mockV3Aggregator: MockV3Aggregator;
      let deployer: SignerWithAddress;

      beforeEach(async () => {
        if (!developmentChains.includes(network.name)) {
          throw "You need to be on a development chain to run tests";
        }

        [deployer] = await ethers.getSigners();

        await deployments.fixture(["mocks"]);

        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );

        fundMeFactory = (await ethers.getContractFactory(
          "FundMe"
        )) as FundMe__factory;

        fundMe = await fundMeFactory.deploy(mockV3Aggregator.address);
      });

      describe("constructor", async () => {
        it("Sets the aggregator addreses correctly", async () => {
          const response = await fundMe.getPriceFeed();

          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.rejectedWith(
            "Did not send enough!"
          );
        });

        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(
            deployer.address
          );

          assert.equal(response.toString(), sendValue.toString());
        });

        it("adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);

          assert.equal(funder, deployer.address);
        });
      });

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single funder", async () => {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          const txResponse = await fundMe.withdraw();
          const txReceipt = await txResponse.wait(1);
          const { effectiveGasPrice, gasUsed } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("withdraw with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);

            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          const txResponse = await fundMe.withdraw();
          const txReceipt = await txResponse.wait(1);
          const { effectiveGasPrice, gasUsed } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          );

          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          await expect(fundMe.getFunder(0)).to.be.rejected;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              "0"
            );
          }
        });

        it("only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.rejectedWith(
            "FundMe__NotOwner"
          );
        });
      });
    });
