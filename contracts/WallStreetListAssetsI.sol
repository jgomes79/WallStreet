pragma solidity ^0.4.2;

contract WallStreetListAssetsI {

  function addNewAsset(uint assetId, uint quantity);

  function moveAssetFromAccounts(address from, address to, uint assetId, uint quantity) returns (bool successful);

  function getAssetInAccount(address from, uint assetId) constant returns (uint quantity);
}
