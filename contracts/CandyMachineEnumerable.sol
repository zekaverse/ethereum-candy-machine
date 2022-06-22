// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./CandyMachine.sol";

contract CandyMachineEnumerable is CandyMachine, ERC721Enumerable {
    constructor(
        address _payment,
        address _whitelist,
        uint256 _price,
        string[] memory _configs,
        bool _presale,
        uint256 _discount,
        string memory _tokenName,
        string memory _tokenSymbol
    )
        CandyMachine(
            _payment,
            _whitelist,
            _price,
            _configs,
            _presale,
            _discount,
            _tokenName,
            _tokenSymbol
        )
    {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, CandyMachine) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, CandyMachine)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
