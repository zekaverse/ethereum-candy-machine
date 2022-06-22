// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CandyMachine is ERC721, ERC721URIStorage, Ownable {
    address public payment;
    address public whitelist;
    bool public presale;
    uint256 public discount;
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
        bool _presale,
        uint256 _discount,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721(_tokenName, _tokenSymbol) {
        payment = _payment;
        whitelist = _whitelist;
        configs = _configs;
        price = _price;
        presale = _presale;
        discount = _discount;
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
    function setConfig(uint256 _index, string memory _uri) public onlyOwner {
        require(!locked);
        configs[_index] = _uri;
    }

    /**
     * add new token uri, only when not locked
     */
    function addConfig(string memory _uri) public onlyOwner {
        require(!locked);
        configs.push(_uri);
    }

    /**
     * set configs array to empty, only when not locked
     */
    function resetConfig() public onlyOwner {
        require(!locked);
        delete configs;
    }

    /**
     * remove token of given index, doesn't keep an order, only when not locked
     */
    function removeConfig(uint256 _index) public onlyOwner {
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
     * update candy machine
     */
    function updateCandyMachine(
        address _payment,
        address _whitelist,
        uint256 _price,
        bool _presale,
        uint256 _discount
    ) public onlyOwner {
        require(!locked);
        payment = _payment;
        whitelist = _whitelist;
        price = _price;
        presale = _presale;
        discount = _discount;
    }

    /**
     * mint one token
     */
    function mint() public {
        bool isOwner = owner() == msg.sender;
        bool isWhitelisted = ERC20Burnable(whitelist).balanceOf(msg.sender) > 0;

        require(configs.length > redeemed, "unavailabled");
        require(locked, "candy machine not yet locked");
        require(
            isOwner ||
                (isWhitelisted && presale) ||
                block.timestamp >= liveTimestamp,
            "candy machine not yet lived"
        );

        if (isWhitelisted) ERC20Burnable(whitelist).burnFrom(msg.sender, 1);
        ERC20Burnable(payment).transferFrom(
            msg.sender,
            owner(),
            isWhitelisted ? price - discount : price
        );

        _safeMint(msg.sender, redeemed);
        _setTokenURI(redeemed, configs[redeemed]);
        redeemed += 1;
    }

    // NOTE: overriding section

    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
