import { Fixture } from "ethereum-waffle";
import hre from "hardhat";
import { ERC20 } from "../../typechain-types";

export interface MockFixture {
  payment: ERC20;
  whitelist: ERC20;
}

const fixture: Fixture<MockFixture> = async (wallets, provider) => {
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const [payment, whitelist] = await Promise.all([
    MockERC20.deploy("Payment", "PM", hre.ethers.utils.parseEther("1000")).then(
      (contract) => contract.deployed()
    ) as Promise<ERC20>,
    MockERC20.deploy(
      "Whitelist",
      "WL",
      hre.ethers.utils.parseEther("1000")
    ).then((contract) => contract.deployed()) as Promise<ERC20>,
  ]);

  return { payment, whitelist };
};

export default fixture;
