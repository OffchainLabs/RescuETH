// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

contract RecoverBags {
    address private recoveryAddress;

    constructor(address _recoveryAddress) {
        recoveryAddress = _recoveryAddress;
    }

    function recover() public {
        recoveryAddress.call{value: address(this).balance}("");
    }
}
