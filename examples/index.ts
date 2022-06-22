import express from "express";
import path from "path";
import { ethers, Signer } from "ethers";
import { faker } from "@faker-js/faker";
import {
  CandyMachine,
  CandyMachine__factory,
  MockERC20,
  MockERC20__factory,
} from "ethereum-candy-machine/typechain-types";

async function deployCandyMachine(): Promise<
  [CandyMachine, MockERC20, MockERC20, Signer]
> {
  const candyMachineFactory = new CandyMachine__factory();
  const erc20Factory = new MockERC20__factory();
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  const price = BigInt(1.5e19);
  const name = "Test";
  const symbol = "TST";
  const available = BigInt(10);

  const configs: string[] = [];

  for (let i = 0; i < available; i++) {
    configs.push(faker.image.image(300, 300, true));
  }

  const payment = await erc20Factory
    .connect(signer)
    .deploy("Payment", "PM", BigInt(1000e19))
    .then((contract) => contract.deployed());
  const whitelist = await erc20Factory
    .connect(signer)
    .deploy("Whitelist", "WL", BigInt(1000e19))
    .then((contract) => contract.deployed());
  const candyMachine = await candyMachineFactory
    .connect(signer)
    .deploy(payment.address, whitelist.address, price, configs, name, symbol)
    .then((contract) => contract.deployed());

  await candyMachine.setLive(0).then((tx) => tx.wait());
  await payment
    .approve(candyMachine.address, price * available)
    .then((tx) => tx.wait());

  console.table({
    candyMachine: candyMachine.address,
    payment: payment.address,
    whitelist: whitelist.address,
    price,
  });

  return [candyMachine, payment, whitelist, signer];
}

async function main() {
  const app = express();

  let [candyMachine, payment, whitelist, signer] = await deployCandyMachine();

  app.set("view engine", "pug");

  app.get("/", async (req, res) => {
    const [list, price, available, redeemed, paymentBalance] =
      await Promise.all([
        candyMachine.configsList(),
        candyMachine.price(),
        candyMachine.available(),
        candyMachine.redeemed(),
        payment.balanceOf(await signer.getAddress()),
      ]);

    const data = {
      list: list,
      payment: paymentBalance,
      address: candyMachine.address,
      price: price,
      available: available,
      redeemed: redeemed,
    };
    res.render("index", data);
  });

  app.get("/mint", async (req, res) => {
    await candyMachine
      .mint()
      .then((tx) => tx.wait())
      .catch(() => console.log("error occured in minting"));

    res.redirect("/");
  });

  app.get("/redeploy", async (req, res) => {
    [candyMachine, payment, whitelist, signer] = await deployCandyMachine();

    res.redirect("/");
  });

  app.use("/scripts", express.static(path.resolve(__dirname, "./scripts")));
  app.use("/styles", express.static(path.resolve(__dirname, "./styles")));
  app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

  app.listen(3000);
}

main();
