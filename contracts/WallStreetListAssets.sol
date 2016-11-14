pragma solidity ^0.4.2;

import "WallStreetListAssetsI.sol";

contract WallStreetListAssets is WallStreetListAssetsI {

  mapping (address => mapping (uint => uint)) assetsInAccounts;

  event OnLogAmmountCantBeZero();
  event OnLogNotEnoughAssets();
  event OnLogAssetsMovedFromAccounts(address from, address to, uint assetId, uint quantity);

  function WallStreetListAssets() {
    // Initialize the contract account with value for testing
    assetsInAccounts[tx.origin][1] = 10000;
    assetsInAccounts[tx.origin][2] = 10000;
    assetsInAccounts[tx.origin][3] = 10000;
  }

  function addNewAsset(uint assetId, uint quantity) {
    assetsInAccounts[tx.origin][assetId] = quantity;
  }

  function moveAssetFromAccounts(address from, address to, uint assetId, uint quantity) returns (bool successful) {
    if (quantity <= 0) {
      OnLogAmmountCantBeZero();
      return false;
    }

    if (assetsInAccounts[from][assetId] < quantity) {
      OnLogNotEnoughAssets();
      return false;
    }

    assetsInAccounts[from][assetId] -= quantity;
    assetsInAccounts[to][assetId] += quantity;

    OnLogAssetsMovedFromAccounts(from, to, assetId, quantity);

    return true;
  }

  function getAssetInAccount(address from, uint assetId) constant returns (uint quantity) {
    return assetsInAccounts[from][assetId];
  }

}
