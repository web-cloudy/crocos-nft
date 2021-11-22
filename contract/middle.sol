// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import '@openzeppelin/contracts/access/Ownable.sol';
interface ICrocos {
  function balanceOf(address _user) external view returns(uint256);
  function transferFrom(address _user1, address _user2, uint256 tokenId) external ;
}
interface ICon20 {
  function balanceOf(address _user) external view returns(uint256);
  function transferFrom(address _user1, address _user2, uint256 tokenId) external ;  
}
contract Middle is Ownable {
  ICrocos public crocosNft;
  ICon20 public conFt;
  mapping(address => uint256) public harvests;
  mapping(address => uint256) public lastUpdate;
  mapping(uint => address) public tokenIdSender;  
  mapping(address => uint) public countOfOwner;
  mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
  mapping(uint256 => uint256) private _ownedTokensIndex;

  constructor (
    address nftAddr,
    address ftAddr
  ) {
    conFt = ICon20(nftAddr);
    crocosNft = ICrocos(ftAddr);
  }
  function stake(uint tokenId) external payable {
    updateHarvest();
    tokenIdSender[tokenId] = msg.sender;
    crocosNft.transferFrom(msg.sender, address(this), tokenId);
    _addTokenToOwner(msg.sender, tokenId);    
    countOfOwner[msg.sender] ++;
  }
  function withdraw(uint tokenId) external payable {
    require(tokenIdSender[tokenId] == msg.sender, "you can't call this");
    updateHarvest();
    crocosNft.transferFrom(address(this), msg.sender, tokenId);
    _removeTokenFromOwner(msg.sender, tokenId);
    countOfOwner[msg.sender]--;
  } 
  function updateHarvest() internal {
    uint256 time = block.timestamp;
    uint256 timerFrom = lastUpdate[msg.sender];
    if (timerFrom > 0)
      // harvests[msg.sender] += countOfOwner[msg.sender] * 12 * 4 * (time - timerFrom) / 864000;
      harvests[msg.sender] += countOfOwner[msg.sender] * 12 * 4 * (time - timerFrom) / 40;
    lastUpdate[msg.sender] = time;
  }
	function harvest() external payable {
    updateHarvest();
		uint256 reward = harvests[msg.sender];
		if (reward > 0) {
      conFt.transferFrom(address(this), msg.sender, harvests[msg.sender]);
			harvests[msg.sender] = 0;			
		}
	}  
  function setNftContractAddr(address nftAddr) public onlyOwner {
    crocosNft = ICrocos(nftAddr);
  }
  function setFtContractAddr(address ftAddr) public onlyOwner {
    conFt = ICon20(ftAddr);
  }
  function getTotalClaimable(address _user) external view returns(uint256) {
    uint256 time = block.timestamp;
    // uint256 pending = countOfOwner[msg.sender] * 12 * 4 * (time - lastUpdate[msg.sender]) / 864000;
    uint256 pending = countOfOwner[msg.sender] * 12 * 4 * (time - lastUpdate[msg.sender]) / 40;
    return harvests[_user] + pending;
	}

  function _addTokenToOwner(address to, uint256 tokenId) private {
      uint256 length = countOfOwner[to];
      _ownedTokens[to][length] = tokenId;
      _ownedTokensIndex[tokenId] = length;
  }
  function _removeTokenFromOwner(address from, uint256 tokenId) private {
      // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
      // then delete the last slot (swap and pop).

      uint256 lastTokenIndex = countOfOwner[from] - 1;
      uint256 tokenIndex = _ownedTokensIndex[tokenId];

      // When the token to delete is the last token, the swap operation is unnecessary
      if (tokenIndex != lastTokenIndex) {
          uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

          _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
          _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
      }

      // This also deletes the contents at the last position of the array
      delete _ownedTokensIndex[tokenId];
      delete _ownedTokens[from][lastTokenIndex];
  }  
}

