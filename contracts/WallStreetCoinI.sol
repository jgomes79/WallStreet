pragma solidity ^0.4.2;

contract WallStreetCoinI {

  function depositMoneyToAccount(address from, uint256 amount) returns (bool successful);

  function withdrawalMoneyFromAccount(address from, uint256 amount) returns (bool successful);

  function sendMoneyBetweenAccounts(address from, address receiver, uint256 amount) returns (bool sufficient);

	function getMoneyInAccount(address from) returns (uint256 money);
}
