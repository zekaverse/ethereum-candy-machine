import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import fixture, { MockFixture } from "./setup/fixture";
import dayjs from "dayjs";
import { CandyMachine, CandyMachine__factory } from "../typechain-types";

describe("CandyMachine", function () {
  const PRICE = ethers.utils.parseEther("0.5");

  let signers: SignerWithAddress[];
  let mock: MockFixture;
  let candyMachine: CandyMachine;

  before(async function () {
    signers = await ethers.getSigners();
  });

  beforeEach(async function () {
    mock = await waffle.loadFixture(fixture);

    const CandyMachine = (await ethers.getContractFactory(
      "CandyMachine"
    )) as CandyMachine__factory;
    candyMachine = await CandyMachine.deploy(
      mock.payment.address,
      mock.whitelist.address,
      PRICE,
      [],
      "Zekaverse",
      "ZKV"
    ).then((contract) => contract.deployed());
  });

  describe("add", function () {
    it("should be able to add configs", async function () {
      await candyMachine.add("test").then((tx) => tx.wait());
      const config = await candyMachine.configs(0);

      expect(config).to.eq("test");
    });
    it("should not be able to add configs when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.add("test")).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(signers[1]).add("test")).to.be.reverted;
    });
  });

  describe("remove", function () {
    it("should be able to remove", async function () {
      await candyMachine.add("test#1").then((tx) => tx.wait());
      await candyMachine.add("test#2").then((tx) => tx.wait());
      await candyMachine.remove(0).then((tx) => tx.wait());

      const available = await candyMachine.available();
      const config = await candyMachine.configs(0);

      expect(available).to.eq(1);
      expect(config).to.eq("test#2");
    });
    it("should not be able to remove when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.remove(0)).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(signers[1]).add("test")).to.be.reverted;
    });
  });

  describe("set", function () {
    it("should be able to set config", async function () {
      await candyMachine.add("test#1").then((tx) => tx.wait());
      await candyMachine.set(0, "test#2").then((tx) => tx.wait());

      const config = await candyMachine.configs(0);

      expect(config).to.eq("test#2");
    });
    it("should not be able to set when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.set(0, "newTest")).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(signers[1]).add("test")).to.be.reverted;
    });
  });

  describe("setLive", function () {
    it("should be able to set lock state and correct timestamp", async function () {
      const now = Math.floor(Date.now() / 1000);
      await candyMachine.setLive(now).then((tx) => tx.wait());

      const liveTimestamp = await candyMachine.liveTimestamp();
      const locked = await candyMachine.locked();

      expect(liveTimestamp).to.eq(now);
      expect(locked).to.be.true;
    });

    it("should not be able to call setLive after locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.setLive(0)).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(signers[1]).add("test")).to.be.reverted;
    });
  });

  describe("mint", async function () {
    it("should be able to mint", async function () {
      await candyMachine.add("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(0).then((tx) => tx.wait());

      await mock.payment
        .approve(candyMachine.address, PRICE)
        .then((tx) => tx.wait());

      let mintTransaction: any;
      const mint = () => {
        if (!mintTransaction) mintTransaction = candyMachine.mint();
        return mintTransaction;
      };

      await expect(mint).to.changeTokenBalances(
        mock.payment,
        [signers[0], candyMachine],
        [BigInt(-PRICE), PRICE]
      );
      await expect(mint())
        .to.emit(candyMachine, "Transfer")
        .withArgs(ethers.constants.AddressZero, signers[0].address, 0);
    });

    it("should be able to mint even if not yet lived (for author)", async function () {
      const next5Minute = dayjs().add(5, "minute").unix();

      await candyMachine.add("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(next5Minute).then((tx) => tx.wait());

      await expect(candyMachine.mint()).to.not.revertedWith(
        "candy machine not yet lived"
      );
    });
    it("should not be able to mint when not lived", async function () {
      const next5Minute = dayjs().add(5, "minute").unix();

      await mock.payment
        .transfer(signers[1].address, PRICE)
        .then((tx) => tx.wait());

      await mock.payment
        .connect(signers[1])
        .approve(candyMachine.address, PRICE)
        .then((tx) => tx.wait());

      await candyMachine.add("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(next5Minute).then((tx) => tx.wait());

      await expect(candyMachine.connect(signers[1]).mint()).to.be.revertedWith(
        "candy machine not yet lived"
      );
    });
    it("should not be able to mint when not locked", async function () {
      await candyMachine.add("test#1").then((tx) => tx.wait());

      await expect(candyMachine.mint()).to.be.revertedWith(
        "candy machine not yet locked"
      );
    });
    it("should not be able to mint when no mint available", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());

      await expect(candyMachine.mint()).to.be.revertedWith("unavailabled");
    });
  });
});
