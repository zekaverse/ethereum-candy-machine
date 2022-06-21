// import { ethers } from "./ethers-5.6.esm.min.js";

function confetti() {
  import(
    "https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"
  ).then(() => {
    window.confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  });
}

async function main() {
  // document.querySelector("#mint").addEventListener("click", async function () {
  //   const json = await fetch("/mint").then((res) => res.json());
  //   console.log(json);
  //   if (json.status === "success") {
  //     confetti();
  //     const redeemed = document.querySelector("#redeemed");
  //     const remaining = document.querySelector("#remaining");
  //     redeemed.innerHTML = parseInt(redeemed.innerHTML) + 1;
  //     remaining.innerHTML = parseInt(remaining.innerHTML) - 1;
  //   }
  // });
}

main().catch((err) =>
  console.error("error occured in excuting web3 scripts.", err)
);
