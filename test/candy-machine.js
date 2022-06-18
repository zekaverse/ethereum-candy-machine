const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CandyMachine", function () {
  it("Should be able to initialized and be minted", async function () {
    const configs = [];
    for (let i = 0; i < 5; i++) {
      configs.push("test#" + i);
    }

    const CandyMachine = await ethers.getContractFactory("CandyMachine");
    const candyMachine = await CandyMachine.deploy(
      "0x467E34cC43A04a5E82727c8B29b603baF5B53A6e",
      BigInt(1e19),
      configs,
      "CandyMachineToken",
      "CMT"
    );
    await candyMachine.deployed();

    await candyMachine.setLive(0).then((tx) => tx.wait());

    await candyMachine.mint().then((tx) => tx.wait());
    await candyMachine.mint().then((tx) => tx.wait());
    await candyMachine.mint().then((tx) => tx.wait());

    const available = await candyMachine.available();
    const redeemed = await candyMachine.redeemed();
    const remaining = await candyMachine.remaining();

    const token1Uri = await candyMachine.tokenURI(0);
    const token2Uri = await candyMachine.tokenURI(1);

    expect(available).to.eq(5);
    expect(redeemed).to.eq(3);
    expect(remaining).to.eq(2);

    expect(token1Uri).to.eq("http://example.org/test#0");
    expect(token2Uri).to.eq("http://example.org/test#1");
  });
});
