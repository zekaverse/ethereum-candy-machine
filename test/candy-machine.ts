import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import fixture from "./setup/fixture";
import dayjs from "dayjs";
import { CandyMachine, MockERC20 } from "../typechain-types";

describe("CandyMachine", function () {
  let PRICE: bigint;

  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let whitelisted: SignerWithAddress;

  let candyMachine: CandyMachine;
  let payment: MockERC20;
  let whitelist: MockERC20;

  beforeEach(async function () {
    const mock = await waffle.loadFixture(fixture);
    [owner, minter, whitelisted] = mock.signers;
    [candyMachine, payment, whitelist] = mock.contracts;
    PRICE = mock.price;
  });

  describe("addConfig", function () {
    it("should be able to add configs", async function () {
      await candyMachine.addConfig("test").then((tx) => tx.wait());
      const config = await candyMachine.configs(0);

      expect(config).to.eq("test");
    });
    it("should not be able to add configs when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.addConfig("test")).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(minter).addConfig("test")).to.be
        .reverted;
    });
  });

  describe("removeConfig", function () {
    it("should be able to remove", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.addConfig("test#2").then((tx) => tx.wait());
      await candyMachine.removeConfig(0).then((tx) => tx.wait());

      const available = await candyMachine.available();
      const config = await candyMachine.configs(0);

      expect(available).to.eq(1);
      expect(config).to.eq("test#2");
    });
    it("should not be able to remove when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.removeConfig(0)).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(minter).addConfig("test")).to.be
        .reverted;
    });
  });

  describe("setConfig", function () {
    it("should be able to set config", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setConfig(0, "test#2").then((tx) => tx.wait());

      const config = await candyMachine.configs(0);

      expect(config).to.eq("test#2");
    });
    it("should not be able to set when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.setConfig(0, "newTest")).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(minter).addConfig("test")).to.be
        .reverted;
    });
  });

  describe("resetConfig", function () {
    it("should be able to reset config", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.addConfig("test#2").then((tx) => tx.wait());

      await candyMachine.resetConfig().then((tx) => tx.wait());

      const configs = await candyMachine.configsList();

      expect(configs).to.be.an("array");
      expect(configs).to.have.lengthOf(0);
    });
    it("should not be able to set when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(candyMachine.resetConfig()).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(candyMachine.connect(minter).resetConfig()).to.be.reverted;
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
      await expect(candyMachine.connect(minter).addConfig("test")).to.be
        .reverted;
    });
  });

  describe("updateCandyMachine", function () {
    it("should be able to update candy machine", async function () {
      await candyMachine
        .updateCandyMachine(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          BigInt(1.5e19),
          true,
          BigInt(1e19)
        )
        .then((tx) => tx.wait());

      const payment = await candyMachine.payment();
      const whitelist = await candyMachine.whitelist();
      const price = await candyMachine.price();
      const presale = await candyMachine.presale();
      const discount = await candyMachine.discount();

      expect(payment).to.eq(ethers.constants.AddressZero);
      expect(whitelist).to.eq(ethers.constants.AddressZero);
      expect(price).to.eq(BigInt(1.5e19));
      expect(presale).to.be.true;
      expect(discount).to.eq(BigInt(1e19));
    });

    it("should not be able update when locked", async function () {
      await candyMachine.setLive(0).then((tx) => tx.wait());
      await expect(
        candyMachine.updateCandyMachine(
          payment.address,
          whitelist.address,
          PRICE,
          false,
          0
        )
      ).to.be.reverted;
    });
    it("should only be able to call by owner only", async function () {
      await expect(
        candyMachine
          .connect(minter)
          .updateCandyMachine(
            payment.address,
            whitelist.address,
            PRICE,
            false,
            0
          )
      ).to.be.reverted;
    });
  });

  describe("mint", async function () {
    it("should be able to mint", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(0).then((tx) => tx.wait());

      let mintTransaction: any;
      const mint = () => {
        if (!mintTransaction)
          mintTransaction = candyMachine.connect(minter).mint();
        return mintTransaction;
      };

      await expect(mint).to.changeTokenBalances(
        payment,
        [minter, owner],
        [-PRICE, PRICE]
      );
      await expect(mint())
        .to.emit(candyMachine, "Transfer")
        .withArgs(ethers.constants.AddressZero, minter.address, 0);
    });

    it("should be able to mint even if not yet lived (for author)", async function () {
      const next5Minute = dayjs().add(5, "minute").unix();

      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(next5Minute).then((tx) => tx.wait());

      await expect(candyMachine.mint()).to.not.reverted;
    });
    it("should not be able to mint when not lived", async function () {
      const next5Minute = dayjs().add(5, "minute").unix();

      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(next5Minute).then((tx) => tx.wait());

      await expect(candyMachine.connect(minter).mint()).to.be.revertedWith(
        "candy machine not yet lived"
      );
    });
    it("should be able to mint and burn whitelist token", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(0).then((tx) => tx.wait());

      await expect(() =>
        candyMachine.connect(whitelisted).mint()
      ).to.changeTokenBalance(whitelist, whitelisted, BigInt(-1));
    });
    it("should be able to mint even if not yet lived, if minter is whitelisted and presale is enabled", async function () {
      const next5Minute = dayjs().add(5, "minute").unix();

      await candyMachine
        .updateCandyMachine(payment.address, whitelist.address, PRICE, true, 0)
        .then((tx) => tx.wait());
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(next5Minute).then((tx) => tx.wait());

      await expect(candyMachine.connect(whitelisted).mint()).to.not.reverted;
    });
    it("should be able to mint with discount, if minter is whitelisted", async function () {
      const discount = BigInt(0.25e19);

      await candyMachine
        .updateCandyMachine(
          payment.address,
          whitelist.address,
          PRICE,
          false,
          discount
        )
        .then((tx) => tx.wait());
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());
      await candyMachine.setLive(0).then((tx) => tx.wait());

      await expect(() =>
        candyMachine.connect(whitelisted).mint()
      ).to.changeTokenBalance(payment, whitelisted, -(PRICE - discount));
    });
    it("should not be able to mint when not locked", async function () {
      await candyMachine.addConfig("test#1").then((tx) => tx.wait());

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
