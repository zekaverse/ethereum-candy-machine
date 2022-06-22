import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Fixture } from "ethereum-waffle";
import hre from "hardhat";
import {
  CandyMachine,
  CandyMachine__factory,
  MockERC20,
} from "../../typechain-types";

export interface MockFixture {
  signers: SignerWithAddress[];
  contracts: [CandyMachine, MockERC20, MockERC20];
  price: bigint;
}

const PRICE = BigInt(1.5e19);
const FUND = BigInt(250e19);

const fund = async (
  candyMachine: CandyMachine,
  payment: MockERC20,
  whitelist: MockERC20,
  minter: SignerWithAddress,
  whitelisted: SignerWithAddress
) => {
  const promises = [
    payment.mintTo(minter.address, FUND).then((tx) => tx.wait()),
    payment
      .connect(minter)
      .approve(candyMachine.address, PRICE)
      .then((tx) => tx.wait()),
    payment.mintTo(whitelisted.address, FUND).then((tx) => tx.wait()),
    whitelist.mintTo(whitelisted.address, FUND).then((tx) => tx.wait()),
    payment
      .connect(whitelisted)
      .approve(candyMachine.address, PRICE)
      .then((tx) => tx.wait()),
    whitelist
      .connect(whitelisted)
      .approve(candyMachine.address, 1)
      .then((tx) => tx.wait()),
    payment.approve(candyMachine.address, PRICE).then((tx) => tx.wait()),
  ];

  return await Promise.all(promises);
};

const fixture: Fixture<MockFixture> = async (wallets, provider) => {
  const [owner, minter, whitelisted] = await hre.ethers.getSigners();
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const [payment, whitelist] = await Promise.all([
    MockERC20.deploy("Payment", "PM", FUND).then((contract) =>
      contract.deployed()
    ) as Promise<MockERC20>,
    MockERC20.deploy("Whitelist", "WL", BigInt(0)).then((contract) =>
      contract.deployed()
    ) as Promise<MockERC20>,
  ]);

  const CandyMachine = (await hre.ethers.getContractFactory(
    "CandyMachine"
  )) as CandyMachine__factory;

  const candyMachine = await CandyMachine.deploy(
    payment.address,
    whitelist.address,
    PRICE,
    [],
    false,
    0,
    "CandyMachineExample",
    "CME"
  ).then((contract) => contract.deployed());

  await fund(candyMachine, payment, whitelist, minter, whitelisted);

  return {
    signers: [owner, minter, whitelisted],
    contracts: [candyMachine, payment, whitelist],
    price: PRICE,
  };
};

export default fixture;
