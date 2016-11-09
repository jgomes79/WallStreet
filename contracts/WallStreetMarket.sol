pragma solidity ^0.4.2;

import "WallStreetCoinI.sol";

contract WallStreetMarket {
  // Operations: Buy or Sell
  enum OrderType { Buy, Sell }

  // Struct to define the market orders
  struct MarketOrder {
    OrderType orderType;
    address from;
    uint quantity;
    uint price;
    uint datetime;
  }

  mapping (uint => MarketOrder[]) public listMarketOrders;

  address public wallStreetCoin;

  event OnOrderPostedToTheMarket(OrderType orderType, uint assetId, uint quantity, uint price);
  event OnExecuteOrderDirectInTheMarket(OrderType orderType, uint assetId, uint quantity, uint price);

	function WallStreetMarket(address _wallStreetCoin) {
    wallStreetCoin = _wallStreetCoin;
	}

  function getMarketOrdersCountByAsset(uint assetId) constant returns (uint count) {
    return listMarketOrders[assetId].length;
  }

  function getMarketOrderByAsset(uint assetId, uint index) constant returns (OrderType orderType, address from, uint quantity, uint price, uint datetime) {
    MarketOrder mo = listMarketOrders[assetId][index];
    return (mo.orderType,mo.from,mo.quantity,mo.price,mo.datetime);
  }

  // Insert a new order in the market. If the order find a match (example I want to buy an asset for 5 and there's a sell
  // order for 5) the order is executed inmediatly, otherwise, the order is listed and ready to be executed
  function postOrderToMarket(OrderType orderType, uint assetId, uint quantity, uint price) returns (bool successful) {
    // Calculate the operation money amount
    uint operationPrice = price * quantity;

    if (orderType == OrderType.Buy) {
      // Check if the buyer has enough money
      if (WallStreetCoinI(wallStreetCoin).getMoneyInAccount(tx.origin) < operationPrice) return false;
    } else {
      // Check if the seller has the asset amount
      if (WallStreetCoinI(wallStreetCoin).getAssetInAccount(tx.origin,assetId) < quantity) return false;
    }

    // Check for a match in the Market
    var (ok,i) = lookforMatch(orderType,assetId,quantity,price);
    if (ok) {
      // Order matched. Execute the operation
      executeOrder(orderType,assetId,i);
    } else {
      // No match. Post to the martket
      listMarketOrders[assetId].push(MarketOrder({
                                orderType: orderType,
                                from: tx.origin,
                                quantity: quantity,
                                price: price,
                                datetime: now }));

      // Notify the order
      OnOrderPostedToTheMarket(orderType,assetId,quantity,price);
    }
  }

  function executeOrderDirectInTheMarket(OrderType orderType, uint assetId, uint quantity) returns (bool successful) {
    // Calculate the operation money amount
    uint iIndex = lookForBestPrice(orderType,assetId);
    executeOrder(orderType,assetId,iIndex);

    return true;
  }

  function executeOrder (OrderType orderType, uint assetId, uint iIndex) returns (bool successful) {
    MarketOrder mm = listMarketOrders[assetId][iIndex];
    uint operationPrice = mm.price * mm.quantity; // TODO. Optimization to search in multiple operation posted in order to get the best quantity to fit

    if (orderType == OrderType.Buy) {
      // Check if the buyer has enough money
      if (WallStreetCoinI(wallStreetCoin).getMoneyInAccount(tx.origin) < operationPrice) return false;

      // TODO. Refactor this to do it dependent beetween results
      if (!WallStreetCoinI(wallStreetCoin).sendMoneyBetweenAccounts(tx.origin,mm.from,operationPrice)) return false;

      if (!WallStreetCoinI(wallStreetCoin).moveAssetFromAccounts(mm.from,tx.origin,assetId,mm.quantity)) return false;

    } else {
      // Check if the seller has the asset amount
      if (WallStreetCoinI(wallStreetCoin).getAssetInAccount(tx.origin,assetId) < mm.quantity) return false;

      // TODO. Refactor this to do it dependent beetween results
      if (!WallStreetCoinI(wallStreetCoin).sendMoneyBetweenAccounts(mm.from,tx.origin,operationPrice)) return false;

      if (!WallStreetCoinI(wallStreetCoin).moveAssetFromAccounts(tx.origin,mm.from,assetId,mm.quantity)) return false;
    }

    // The operation is done. Remove it from market
    delete listMarketOrders[assetId][iIndex];

    OnExecuteOrderDirectInTheMarket(orderType, assetId, mm.quantity, mm.price);

    return true;
  }

  function lookForBestPrice(OrderType orderType, uint assetId) constant returns (uint index) {
    uint iBestPrice = 0;
    uint iIndex = 0;
    uint iCount = listMarketOrders[assetId].length;

    for (uint i=0;i<iCount;i++) {
      MarketOrder mm = listMarketOrders[assetId][i];
      uint mmPrice = mm.price * mm.quantity;
      if (i==0) iBestPrice = mmPrice;

      if (orderType == OrderType.Buy) {
        if (mmPrice < iBestPrice) {
          iBestPrice = mmPrice;
          iIndex = i;
        }
      } else {
        if (mmPrice > iBestPrice) {
          iBestPrice = mmPrice;
          iIndex = i;
        }
      }
    }

    return iIndex;
  }

  function lookforMatch(OrderType orderType, uint assetId, uint quantity, uint price) constant returns (bool successful, uint index) {
    uint iCount = listMarketOrders[assetId].length;

    for (uint i=0;i<iCount;i++) {
      MarketOrder mm = listMarketOrders[assetId][i];
      if (mm.orderType == orderType && mm.quantity == quantity && mm.price == price) {
        return (true,i);
      }
    }

    return (false,0);
  }
}
