import express from "express";
import path from "path";
import { ethers, Signer } from "ethers";
import { faker } from "@faker-js/faker";
import {
  CandyMachineEnumerable,
  CandyMachineEnumerable__factory,
  MockERC20,
  MockERC20__factory,
} from "ethereum-candy-machine/typechain-types";
import fetch from "node-fetch";
import { open } from "openurl";

const PORT = process.env.PORT || 3000;

async function deployCandyMachine(): Promise<
  [CandyMachineEnumerable, MockERC20, MockERC20, Signer]
> {
  const candyMachineFactory = new CandyMachineEnumerable__factory();
  const erc20Factory = new MockERC20__factory();
  const provider = new ethers.providers.JsonRpcProvider();

  const signer = provider.getSigner(0);
  const minter = provider.getSigner(1);

  const price = BigInt(1.5e19);
  const name = "Test";
  const symbol = "TST";
  const available = BigInt(10);

  const configs: string[] = [];

  for (let i = 0; i < available; i++) {
    const url = await fetch(faker.image.cats(300, 300, true)).then(
      (res) => res.url
    );
    configs.push(url);
  }

  const [payment, whitelist] = await Promise.all([
    erc20Factory
      .connect(signer)
      .deploy("Payment", "PM", BigInt(0))
      .then((contract) => contract.deployed()),
    erc20Factory
      .connect(signer)
      .deploy("Whitelist", "WL", BigInt(0))
      .then((contract) => contract.deployed()),
  ]);
  const candyMachine = await candyMachineFactory
    .connect(signer)
    .deploy(
      payment.address,
      whitelist.address,
      price,
      configs,
      false,
      BigInt(0),
      name,
      symbol
    )
    .then((contract) => contract.deployed());

  await candyMachine.setLive(0).then((tx) => tx.wait());

  await payment
    .mintTo(await minter.getAddress(), BigInt(1000e19))
    .then((tx) => tx.wait());
  await payment
    .connect(minter)
    .approve(candyMachine.address, price * available)
    .then((tx) => tx.wait());

  console.table({
    candyMachine: candyMachine.address,
    payment: payment.address,
    whitelist: whitelist.address,
    price,
  });

  return [candyMachine.connect(minter), payment, whitelist, minter];
}

async function main() {
  const app = express();

  let [candyMachine, payment, whitelist, minter] = await deployCandyMachine();

  app.set("view engine", "pug");

  app.get("/", async (req, res) => {
    const address = await minter.getAddress();
    const balance = await candyMachine.balanceOf(address);
    const minted: string[] = [];

    for (let i = BigInt(0); i < balance.toBigInt(); i++) {
      const uri = await candyMachine
        .tokenOfOwnerByIndex(address, i)
        .then((id) => candyMachine.tokenURI(id));

      minted.push(uri);
    }

    const [list, price, available, redeemed, paymentBalance] =
      await Promise.all([
        candyMachine.configsList(),
        candyMachine.price(),
        candyMachine.available(),
        candyMachine.redeemed(),
        payment.balanceOf(address),
      ]);

    const data = {
      list: list,
      payment: paymentBalance,
      address: candyMachine.address,
      price: price,
      available: available,
      redeemed: redeemed,
      minted,
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
    [candyMachine, payment, whitelist, minter] = await deployCandyMachine();

    res.redirect("/");
  });

  app.use("/scripts", express.static(path.resolve(__dirname, "./scripts")));
  app.use("/styles", express.static(path.resolve(__dirname, "./styles")));
  app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

  app.listen(PORT, () => {
    console.log("Listening on %s", PORT);
    if (process.env.NODE_ENV === "production") open("http://localhost:3000");
  });
}

main();
