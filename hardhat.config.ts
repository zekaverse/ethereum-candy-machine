import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "dotenv/config";
import { CandyMachine__factory, CandyMachine } from "./typechain-types";

function getCandyMachineAddress() {
  if (!process.env.CANDY_MACHINE_ADDRESS)
    throw new Error("no candy machine address provied");

  return process.env.CANDY_MACHINE_ADDRESS;
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploy candy machine")
  .addPositionalParam("payment", "payment token address")
  .addPositionalParam("whitelist", "whitelist token address")
  .addPositionalParam("price", "price of mint")
  .addPositionalParam("name", "name of candy machine")
  .addPositionalParam("symbol", "symbol of candy machine")
  .setAction(async (taskArgs, hre) => {
    const price = hre.ethers.BigNumber.from(taskArgs.price);

    const CandyMachine = (await hre.ethers.getContractFactory(
      "CandyMachine"
    )) as CandyMachine__factory;
    const candyMachine = await CandyMachine.deploy(
      taskArgs.payment,
      taskArgs.whitelist,
      price,
      [],
      taskArgs.name,
      taskArgs.symbol
    ).then((contract) => contract.deployed());

    console.log("Candy machine deployed at %s", candyMachine.address);
  });

task("configs", "List of config (uri)")
  .addOptionalParam("address", "address of candy machine")
  .setAction(async (taskArgs, hre) => {
    const candyMachine = (await hre.ethers.getContractAt(
      "CandyMachine",
      taskArgs.address || getCandyMachineAddress()
    )) as CandyMachine;

    console.log(await candyMachine.configsList());
  });

task("add", "Add new config")
  .addOptionalParam("address", "address of candy machine")
  .addPositionalParam("uri", "metadata uri")
  .setAction(async (taskArgs, hre) => {
    const candyMachine = (await hre.ethers.getContractAt(
      "CandyMachine",
      taskArgs.address || getCandyMachineAddress()
    )) as CandyMachine;

    await candyMachine.add(taskArgs.uri).then((tx) => tx.wait());
  });

const config: HardhatUserConfig = {
  solidity: "0.8.4",
};

export default config;
