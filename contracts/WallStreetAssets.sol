pragma solidity ^0.4.2;

import "WallStreetAssetsI.sol";

contract WallStreetAssets is WallStreetAssetsI {

  mapping(uint => Asset) public assets;
  uint[] public assetIds;

	event LogAssetAdded(AssetType assetType, string name, string symbol, uint id);
  event LogAssetRemoved(uint id);

	function WallStreetAssets() {
    addAsset(AssetType.Stock,"Apple","APPL",1);
    addAsset(AssetType.Stock,"Google","GOGGL",2);
    addAsset(AssetType.Stock,"Microsoft","MICRO",3);
	}

  function addAsset(AssetType assetType, string name, string symbol, uint id) fromOwner returns (bool successful) {
    assets[id] = Asset({
                  assetType: assetType,
                  name: name,
                  symbol: symbol,
                  id: id});
    assetIds.push(id);

    LogAssetAdded(assetType,name,symbol,id);

    return true;
  }

  function removeAsset(uint id) fromOwner returns (bool successful) {
    delete assets[id];
    delete assetIds[id];

    LogAssetRemoved(id);

    return true;
  }

  function getAsset(uint id) constant returns (AssetType assetType, string name, string symbol) {
    Asset asset = assets[id];

    return (asset.assetType,asset.name,asset.symbol);
  }

  function getAssetsCount() constant returns (uint count) {
    return assetIds.length;
  }
}
