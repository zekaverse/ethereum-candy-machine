//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

// import "@openzeppelin/contracts/utils/Counters.sol";

contract CandyMachine is ERC721, ERC721URIStorage, Ownable {
    address public paymentErc20;
    uint256 public available;
    uint256 public redeemed;
    uint256 public price;
    uint256 public liveTimestamp;
    bool public lived;
    string[] public configs;

    constructor(
        address _paymentErc20,
        uint256 _price,
        string[] memory _configs,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        paymentErc20 = _paymentErc20;
        available = _configs.length;
        configs = _configs;
        price = _price;
    }

    /**
     * set token uri at index, only when not lived
     */
    function set(uint256 _index, string memory _uri) public onlyOwner {
        require(!lived);
        configs[_index] = _uri;
    }

    /**
     * add new token uri, only when not lived
     */
    function add(string memory _uri) public onlyOwner {
        require(!lived);
        configs.push(_uri);
        available += 1;
    }

    /**
     * get remaining mintable token in candy machine
     */
    function remaining() public view returns (uint256) {
        return available - redeemed;
    }

    /**
     * set candy machine to be lived at timestamp
     */
    function setLive(uint256 _timestamp) public onlyOwner {
        require(!lived);
        lived = true;
        liveTimestamp = _timestamp;
    }

    /**
     * mint one token
     * TODO add payment
     */
    function mint() public {
        require(available > redeemed, "unavailabled");
        require(lived, "candy machine not yet locked in");
        require(block.timestamp >= liveTimestamp, "mint not yet lived");

        _safeMint(msg.sender, redeemed);
        _setTokenURI(redeemed, configs[redeemed]);
        redeemed += 1;
    }

    // NOTE: overriding section

    function _baseURI() internal pure override returns (string memory) {
        return "http://example.org/";
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
