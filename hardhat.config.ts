import { HardhatUserConfig } from "hardhat/config";
import HardhatRuntimeEnvironment from "hardhat";
import { getContractAddress } from "@ethersproject/address";

import "@nomicfoundation/hardhat-toolbox";
import { task } from "hardhat/config";
import { log } from "console";
require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: String(process.env.GOERLI_RPC),
      accounts: [String(process.env.TESTNET_PRIVKEY)],
    },
    arbgoerli: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: [String(process.env.TESTNET_PRIVKEY)],
    },
    arbOne: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: [String(process.env.MAINNET_PRIVKEY)],
    },
    arbNova: {
      url: "https://nova.arbitrum.io/rpc	",
      accounts: [String(process.env.MAINNET_PRIVKEY)],
    },
  },
};

const isRecoverable = async (
  hre: typeof HardhatRuntimeEnvironment,
  targetAddress: string,
  noncesToTry = 50
) => {
  const targetAddressLCase = targetAddress.toLowerCase();
  const { ethers } = hre;

  // ensure target address is indeed an address
  if (!ethers.utils.isAddress(targetAddress)) {
    console.log(`${targetAddress} not an address`);
    return false;
  }

  // ensure no contract deployed there yet
  const code = await ethers.provider.getCode(targetAddress);
  if (code.length > 2) {
    console.log(`Contract already deployed at${targetAddress} `);
    return false;
  }

  // check if the current signer will eventually deploy a contract with contrac address
  const [owner] = await ethers.getSigners();
  for (let i = 0; i < noncesToTry; i++) {
    const nonce = (await owner.getTransactionCount()) + i;
    console.log("checking nonce", nonce);

    const futureAddress = getContractAddress({
      from: owner.address,
      nonce,
    });
    if (futureAddress.toLowerCase() === targetAddressLCase) {
      return true;
    }
  }
  const nonce = await owner.getTransactionCount();
  console.log(
    `${owner.address} does not generate ${targetAddress}; tried ${noncesToTry} nonces, starting with ${nonce}`
  );
  return false;
};
task("recover", "recover-funds")
  .addParam("targetaddress", "address from which to recover ETH")
  .addParam("recoveryaddress", "address to which recovered eth will be sent")
  .addOptionalParam("noncestotry", "# of nonces to try (defaults to 50")

  .setAction(async (taskArgs, hre) => {
    const targetAddressLCase = taskArgs.targetaddress.toLowerCase();
    const recoveryAddress = taskArgs.recoveryaddress;
    const noncesToTry = taskArgs.noncestotry || 50;

    if (!(await isRecoverable(hre, targetAddressLCase))) {
      throw new Error("Target address is not recoverable from signer");
    }

    console.log(`${targetAddressLCase} is recoverable!`);
    const { ethers } = hre;

    // check that recovery address is indeed an address
    if (!ethers.utils.isAddress(recoveryAddress)) {
      throw new Error(`recovery address ${recoveryAddress} not an address`);
    }
    const [signer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(signer.address);

    // ensure signer has some funds to pay fees
    if (balance.isZero()) {
      throw new Error(`${signer.address} has zero balance`);
    }

    for (let i = 0; i < noncesToTry; i++) {
      const nonce = await signer.getTransactionCount();
      const futureAddress = getContractAddress({
        from: signer.address,
        nonce,
      });
      // see if next transaction will deploy a contract at the target address
      if (futureAddress.toLowerCase() === targetAddressLCase) {
        // do the thing
        const RecoverBags = await ethers.getContractFactory("RecoverBags");
        const recoverBags = await RecoverBags.deploy(recoveryAddress);
        await recoverBags.deployed();

        const connectedRecoverBags = RecoverBags.attach(recoverBags.address);
        const res = await connectedRecoverBags.recover();
        const rec = await res.wait(2);
        console.log("done!");
        return;
      } else {
        // burn a nonce
        const res = await signer.sendTransaction({
          to: signer.address,
          value: 0,
        });
        const rec = await res.wait(2);
        console.log("burned nonce", nonce);
      }
    }
  });
export default config;
