pragma solidity ^0.4.2;

import "Owned.sol";

contract WallStreetAssetsI is Owned {
  enum AssetType  { Stock, Option, Future }

  struct Asset {
  		AssetType assetType;
      string name;
      string symbol;
  		uint id;
  }

  function addAsset(AssetType assetType, string name, string symbol, uint id) fromOwner returns (bool successful);

  function removeAsset(uint id) fromOwner returns (bool successful);

  function getAsset(uint id) returns (AssetType assetType, string name, string symbol);

  function getAssetsCount() returns (uint count);
}
