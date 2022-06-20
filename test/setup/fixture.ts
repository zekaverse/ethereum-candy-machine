import { Fixture } from "ethereum-waffle";
import { Contract } from "ethers";
import { ethers } from "hardhat";

export interface MockFixture {
  payment: Contract;
  whitelist: Contract;
}

const fixture: Fixture<MockFixture> = async (wallets, provider) => {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const [payment, whitelist] = await Promise.all([
    MockERC20.deploy("Payment", "PM", ethers.utils.parseEther("1000")).then(
      (contract) => contract.deployed()
    ),
    MockERC20.deploy("Whitelist", "WL", ethers.utils.parseEther("1000")).then(
      (contract) => contract.deployed()
    ),
  ]);

  return { payment, whitelist };
};

export default fixture;
