//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract CandyMachine is ERC721, ERC721URIStorage, Ownable {
    address public payment;
    address public whitelist;
    uint256 public redeemed;
    uint256 public price;
    uint256 public liveTimestamp;
    bool public locked;
    string[] public configs;

    constructor(
        address _payment,
        address _whitelist,
        uint256 _price,
        string[] memory _configs,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        payment = _payment;
        whitelist = _whitelist;
        configs = _configs;
        price = _price;
    }

    /**
     *   return list of configs
     */
    function configsList() public view returns (string[] memory) {
        return configs;
    }

    /**
     * set token uri at index, only when not locked
     */
    function set(uint256 _index, string memory _uri) public onlyOwner {
        require(!locked);
        configs[_index] = _uri;
    }

    /**
     * add new token uri, only when not locked
     */
    function add(string memory _uri) public onlyOwner {
        require(!locked);
        configs.push(_uri);
    }

    /**
     * remove token of given index, only when not locked
     */
    function remove(uint256 _index) public onlyOwner {
        require(!locked);
        configs[_index] = configs[configs.length - 1];
        configs.pop();
    }

    /**
     * get remaining mintable token in candy machine
     */
    function available() public view returns (uint256) {
        return configs.length;
    }

    /**
     * get remaining mintable token in candy machine
     */
    function remaining() public view returns (uint256) {
        return configs.length - redeemed;
    }

    /**
     * set candy machine to be locked at timestamp
     */
    function setLive(uint256 _timestamp) public onlyOwner {
        require(!locked);
        locked = true;
        liveTimestamp = _timestamp;
    }

    /**
     * mint one token
     * TODO whitelist goods
     */
    function mint() public {
        bool isOwner = owner() == msg.sender;
        // bool isWhitelisted = ERC20(whitelist).balanceOf(msg.sender) >= 0;

        require(configs.length > redeemed, "unavailabled");
        require(locked, "candy machine not yet locked");
        require(
            isOwner || block.timestamp >= liveTimestamp,
            "candy machine not yet lived"
        );

        ERC20(payment).transferFrom(msg.sender, address(this), price);

        _safeMint(msg.sender, redeemed);
        _setTokenURI(redeemed, configs[redeemed]);
        redeemed += 1;
    }

    // NOTE: overriding section

    // function _baseURI() internal pure override returns (string memory) {
    //     return "http://example.org/";
    // }

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
