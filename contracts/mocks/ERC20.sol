// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockERC20 is ERC20, ERC20Burnable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _total
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, _total);
    }

    function mintTo(address _to, uint256 _total) public {
        _mint(_to, _total);
    }
}
