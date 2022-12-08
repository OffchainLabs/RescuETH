## RescuETH

To be used by the deployer of a contract at address A on chain X, to rescue the ETH of a user who accidentally sent ETH to address A on some other chain Y.

Checks that ETH is still recoverable (i.e., nonce for deployer address is still available) and recovers Eth by deploying a RecoverBags contract if so.

### Set up

See hardhat config; ensure relevant network RPC urls / pks are configed (i.e., see .env.sample).

### Run

`yarn hardhat recover --targetaddress <0x-targetAddress> --recoveryaddress <0x-recovery-adddress> --network <network-name>`

**targetaddress**: address from which to recover ETH
**recoveryaddress**: address to which recovered eth will be sent
((noncestotry)) (optional): of nonces to try (defaults to 50")
.addOptionalParam("", "# of nonces to try (defaults to 50")
