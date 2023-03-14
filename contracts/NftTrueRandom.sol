// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title Positive Even Number Setter -- the contract which sets a value of the positive even number.
 *
 * @dev This contract includes the following functionality:
 *  - Setting of the positive even number by the owner.
 *  - Getting of a value of the set number.
 */
contract NftTrueRandom is ERC721, Ownable {
    using Counters for Counters.Counter;

    // _______________ Storage _______________
    Counters.Counter public numerOfMintedNft;
    
    uint256 public lastApplyBlockNumber;
    bool public isNftpriceInEther;
    
    uint256 public ethNftPrice;

    IERC20 public paymentToken;
    uint256 public erc20NftPrice;

    uint16 [1000] public notUsedNftIds; // 65535 - max value
    uint256 MAX_NFT_NUMBER;
    string [] public URIs;
    
    // which block determine user random number
    // 1 user in block
    mapping (address => uint256[]) public userRandomBlocks;
    mapping (uint256 => bytes32) public nftIdToRandom;
    mapping (uint256 => bool) public isNftIdMinted;
    mapping (uint256 => uint256) public nftToUriId;
    

    // _______________ Errors _______________


    // _______________ Events _______________

    event NewNftMinted(uint256 nftId, address owner);


    // _______________ Constructor ______________

    /// @dev Initializes the contract setting the deployer as the initial owner and the variable `positiveEven` with 2.
    constructor( ) ERC721("NftTrueRandom", "NTR") Ownable() {
        ethNftPrice = 1 ether;
        isNftpriceInEther = true;

        
        MAX_NFT_NUMBER = 100;
    }

    // _______________ External functions _______________

    function mint(address _mintee, uint8 _userArrayIndex) public{
        require(userRandomBlocks[_mintee].length != 0, "no nft to be minted");

        uint256[] storage blockIds = userRandomBlocks[_mintee];
        uint256 userBlockNumber = userRandomBlocks[_mintee][_userArrayIndex];
        
        require(block.number >= userBlockNumber, "too early to mint");
        require(block.number <= userBlockNumber + 256, "too late to mint");
        
        numerOfMintedNft.increment();
        uint256 curNftId = numerOfMintedNft.current();
        
        console.logBytes32(blockhash(userBlockNumber));
        // nftIdToRandom[curNftId] = blockhash(userBlockNumber);
        

        //delete minted blockId from user blockIds
        if(_userArrayIndex == (blockIds.length - 1)) {
            blockIds.pop();
        } else {
            uint256 lastElement = blockIds[blockIds.length - 1];
            blockIds[_userArrayIndex] = lastElement;
            blockIds.pop();
        }
        //convert NFT blockhash to random nft id
        uint256 idFromNotUsedNft = (uint256(blockhash(userBlockNumber)) % notUsedNftIds.length);
        uint16 newNftId = notUsedNftIds[idFromNotUsedNft];
        
        //remove used nft id
        notUsedNftIds[idFromNotUsedNft] = notUsedNftIds[notUsedNftIds.length - 1];
        notUsedNftIds.pop();
        //mint
        _mint(_mintee, newNftId);

        emit NewNftMinted(newNftId, _mintee);
    }

    function applyForMint() public payable{
        //collect payment
        bool erc20Paid;
        if(msg.value == 0){
            erc20Paid = paymentToken.transferFrom(msg.sender, address(this), erc20NftPrice );
        }
        require(erc20Paid == true || msg.value == ethNftPrice, "Payment is not received");
        
        //check that one apply per block
        require(lastApplyBlockNumber != block.number, "Cannot apply for mint in this block, try one more time");
        
        //give block number which detrmine user random
        lastApplyBlockNumber = block.number;
        uint256[] storage blockIds  = userRandomBlocks[msg.sender];
        blockIds.push(block.number + 128);
    }
    // ______________ Setters and getters_______________

    function setPriceInEther(uint256 _price) public onlyOwner {
        ethNftPrice = _price;
        isNftpriceInEther = true;
    }
    function setPriceInErc20(address _token, uint256 _price) public onlyOwner{
        erc20NftPrice = _price;
        paymentToken = IERC20(_token);
    }

    function initializeNotUsedNftId(uint256 _totalNftNumber) public onlyOwner{
        for(uint16 i = 0; i< _totalNftNumber; i++){
            notUsedNftIds[i] = i;
        }
    }
    // test function
    function setURIs( string[] memory _URIs) public onlyOwner{
        URIs = _URIs;
    }


}
