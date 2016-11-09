pragma solidity ^0.4.2;

import "WallStreetCoinI.sol";
import "WallStreetAssetsI.sol";

contract WallStreetCoin is WallStreetCoinI {
	mapping (address => uint256) balancesInAccounts;
	mapping (address => mapping (uint => uint)) assetsInAccounts;

	event OnMoneyDepositedInAccount(address from, uint256 amount);
	event OnMoneyWithdrawnFromAccount(address from, uint256 amount);
	event OnSendMoneyBetweenAccounts(address from, address to, uint256 amount);

	function WallStreetCoin() {
		// Initialize the contract account with value for testing
		assetsInAccounts[tx.origin][1] = 10000;
		assetsInAccounts[tx.origin][2] = 10000;
		assetsInAccounts[tx.origin][3] = 10000;

		balancesInAccounts[tx.origin] = 100000000;
	}

	function depositMoneyToAccount(address from, uint256 amount) returns (bool successful) {
		if (amount <= 0) return false;

		balancesInAccounts[from] += amount;
		OnMoneyDepositedInAccount(from, amount);

		return true;
	}

	function withdrawalMoneyFromAccount(address from, uint256 amount) returns (bool successful) {
		if (amount > balancesInAccounts[from]) return false;

		balancesInAccounts[from] -= amount;
		OnMoneyWithdrawnFromAccount(from, amount);

		return true;
	}

	function sendMoneyBetweenAccounts(address from, address receiver, uint256 amount) returns (bool sufficient) {
		if (balancesInAccounts[from] < amount) return false;

		balancesInAccounts[from] -= amount;
		balancesInAccounts[receiver] += amount;
		OnSendMoneyBetweenAccounts(from, receiver, amount);

		return true;
	}

	function getMoneyInAccount(address from) returns (uint256 money) {
		return balancesInAccounts[from];
	}

	function moveAssetFromAccounts(address from, address to, uint assetId, uint quantity) returns (bool successful) {
		assetsInAccounts[from][assetId] -= quantity;
		assetsInAccounts[to][assetId] += quantity;

		return true;
	}

	function getAssetInAccount(address from, uint assetId) returns (uint quantity) {
		return assetsInAccounts[from][assetId];
	}
}
