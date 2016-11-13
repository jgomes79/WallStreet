pragma solidity ^0.4.2;

import "WallStreetAssetsI.sol";
import "WallStreetMarketI.sol";

contract WallStreetAssets is WallStreetAssetsI {

  mapping(uint => Asset) public assets;
  uint[] public assetIds;

  address public wallStreetMarket;

  event OnLogAssetExists(uint id);
	event OnLogAssetAdded(AssetType assetType, string name, string symbol, uint id);
  event OnLogCantRemoveAssetBecauseOrdersPending(uint id);
  event OnLogAssetRemoved(uint id);

	function WallStreetAssets(address _wallStreetMarket) {
    wallStreetMarket = _wallStreetMarket;

    addAsset(AssetType.Stock,"Apple","APPL",1);
    addAsset(AssetType.Stock,"Google","GOGGL",2);
    addAsset(AssetType.Stock,"Microsoft","MICRO",3);
	}

  function addAsset(AssetType assetType, string name, string symbol, uint id) fromOwner returns (bool successful) {
    // Check the asset id is valid
    if (assets[id].id == id) {
      OnLogAssetExists(id);
      return false;
    }

    assets[id] = Asset({
                  assetType: assetType,
                  name: name,
                  symbol: symbol,
                  active: true,
                  id: id});
    assetIds.push(id);

    OnLogAssetAdded(assetType,name,symbol,id);

    return true;
  }

  function removeAsset(uint id) fromOwner returns (bool successful) {
    // First check in the market if there's orders pending for this asset
    if (WallStreetMarketI(wallStreetMarket).getMarketOrdersCountByAsset(id) > 0) {
      OnLogCantRemoveAssetBecauseOrdersPending(id);
      return false;
    }

    assets[id].active = false;
    removeAssetId(id);

    OnLogAssetRemoved(id);

    return true;
  }

  function getAsset(uint id) constant returns (AssetType assetType, string name, string symbol, bool active) {
    Asset asset = assets[id];

    return (asset.assetType,asset.name,asset.symbol,asset.active);
  }

  function getAssetsCount() constant returns (uint count) {
    return assetIds.length;
  }

  function removeAssetId(uint id) internal returns(uint[]) {
    if (index >= assetIds.length) return;

    uint index = 0;
    for (uint i = 0; i<assetIds.length; i++){
        if (assetIds[i] == id)
          index = i;
    }

    for (uint j = index; j<assetIds.length-1; i++){
        assetIds[j] = assetIds[j+1];
    }
    delete assetIds[assetIds.length-1];
    assetIds.length--;

    return assetIds;
  }
}
