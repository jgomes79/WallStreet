pragma solidity ^0.4.2;

import "WallStreetCoinI.sol";
import "WallStreetAssetsI.sol";

contract WallStreetCoin is WallStreetCoinI {
	mapping (address => uint256) balancesInAccounts;

	event OnLogAmmountCantBeZero();
	event OnLogNotEnoughMoney();
	event OnLogMoneyDepositedInAccount(address from, uint256 amount);
	event OnLogMoneyWithdrawnFromAccount(address from, uint256 amount);
	event OnLogSendMoneyBetweenAccounts(address from, address to, uint256 amount);

	function WallStreetCoin() {
		// Initialize the contract account with value for testing
		balancesInAccounts[tx.origin] = 100000000;
	}

	function depositMoneyToAccount(address from, uint256 amount) returns (bool successful) {
		if (amount <= 0) {
			OnLogAmmountCantBeZero();
			return false;
		}

		balancesInAccounts[from] += amount;
		OnLogMoneyDepositedInAccount(from, amount);

		return true;
	}

	function withdrawalMoneyFromAccount(address from, uint256 amount) returns (bool successful) {
		if (amount > balancesInAccounts[from]) {
			OnLogNotEnoughMoney();
			return false;
		}

		balancesInAccounts[from] -= amount;
		OnLogMoneyWithdrawnFromAccount(from, amount);

		return true;
	}

	function sendMoneyBetweenAccounts(address from, address receiver, uint256 amount) returns (bool sufficient) {
		if (balancesInAccounts[from] < amount) {
			OnLogNotEnoughMoney();
			return false;
		}

		balancesInAccounts[from] -= amount;
		balancesInAccounts[receiver] += amount;
		OnLogSendMoneyBetweenAccounts(from, receiver, amount);

		return true;
	}

	function getMoneyInAccount(address from) returns (uint256 money) {
		return balancesInAccounts[from];
	}
}
