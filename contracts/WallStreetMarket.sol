pragma solidity ^0.4.2;

import "WallStreetCoinI.sol";
import "WallStreetMarketI.sol";

contract WallStreetMarket is WallStreetMarketI {

  // Mapping AssetId => MarketOrders array
  mapping (uint => MarketOrder[]) public listMarketOrders;

  address public wallStreetCoin;

  event OnLogNotEnoughMoney();
  event OnLogOrderPostedToTheMarket(OrderType orderType, uint assetId, uint quantity, uint price, bytes32 orderId);
  event OnLogExecuteOrder(OrderType orderType, uint assetId, uint quantity, uint price, bytes32 orderId);

	function WallStreetMarket(address _wallStreetCoin) {
    wallStreetCoin = _wallStreetCoin;
	}

  function getMarketOrdersCountByAsset(uint assetId) constant returns (uint count) {
    uint activeOrders = 0;
    for (uint i=0;i<listMarketOrders[assetId].length;i++) {
      if (listMarketOrders[assetId][i].active == true) activeOrders++;
    }

    return activeOrders;
  }

  function getMarketOrderByAsset(uint assetId, uint index) constant returns (OrderType orderType, address from, uint quantity, uint price, uint datetime, bool active, bytes32 orderId) {
    MarketOrder mo = listMarketOrders[assetId][index];
    return (mo.orderType,mo.from,mo.quantity,mo.price,mo.datetime,mo.active,mo.orderId);
  }

  // Insert a new order in the market. If the order find a match (example I want to buy an asset for 5 and there's a sell
  // order for 5) the order is executed inmediatly, otherwise, the order is listed and ready to be executed
  function postOrderToMarket(OrderType orderType, uint assetId, uint quantity, uint price) returns (bool successful) {
    // Calculate the operation money amount
    uint operationPrice = price * quantity;

    if (orderType == OrderType.Buy) {
      // Check if the buyer has enough money
      if (WallStreetCoinI(wallStreetCoin).getMoneyInAccount(msg.sender) < operationPrice) {
        OnLogNotEnoughMoney();
        return false;
      }
    }

    // Check for a match in the Market
    var (ok,idOrder) = lookforMatch(orderType,assetId,quantity,price);
    if (ok) {
      // Order matched. Execute the operation
      executeOrder(assetId,idOrder);
    } else {
      // No match. Post to the martket
      var orderId = sha3(msg.sender,now,assetId,quantity,price);
      listMarketOrders[assetId].push(MarketOrder({
                                orderType: orderType,
                                from: msg.sender,
                                quantity: quantity,
                                price: price,
                                datetime: now,
                                active: true,
                                orderId: orderId}));

      // Notify the order
      OnLogOrderPostedToTheMarket(orderType,assetId,quantity,price,orderId);
    }
  }

  function executeOrderDirectInTheMarket(OrderType orderType, uint assetId) returns (bool successful) {
    // Calculate the operation money amount
    bytes32 idOrder = lookForBestPrice(orderType,assetId);
    executeOrder(assetId,idOrder);

    return true;
  }

  function executeOrder (uint assetId, bytes32 orderId) returns (bool successful) {
    var (index,mm) = getMarketOrderById(assetId,orderId);
    uint operationPrice = mm.price * mm.quantity; // TODO. Optimization to search in multiple operation posted in order to get the best quantity to fit

    if (mm.orderType == OrderType.Buy) {
      // Check if the buyer has enough money
      if (WallStreetCoinI(wallStreetCoin).getMoneyInAccount(msg.sender) < operationPrice) {
        OnLogNotEnoughMoney();
        return false;
      }

      if (!WallStreetCoinI(wallStreetCoin).sendMoneyBetweenAccounts(msg.sender,mm.from,operationPrice)) return false;

    }

    OnLogExecuteOrder(mm.orderType, assetId, mm.quantity, mm.price, mm.orderId);

    // The operation is done. Remove it from market
    listMarketOrders[assetId][index].active = false;

    return true;
  }

  function lookForBestPrice(OrderType orderType, uint assetId) constant returns (bytes32 id) {
    uint iBestPrice = 0;
    bytes32 orderId;
    uint iCount = listMarketOrders[assetId].length;

    for (uint i=0;i<iCount;i++) {
      MarketOrder mm = listMarketOrders[assetId][i];
      if (mm.active == true) {
        uint mmPrice = mm.price * mm.quantity;
        if (i==0) iBestPrice = mmPrice;

        if (orderType == OrderType.Buy) {
          if (mmPrice < iBestPrice) {
            iBestPrice = mmPrice;
            orderId = mm.orderId;
          }
        } else {
          if (mmPrice > iBestPrice) {
            iBestPrice = mmPrice;
            orderId = mm.orderId;
          }
        }
      }
    }

    return orderId;
  }

  function lookforMatch(OrderType orderType, uint assetId, uint quantity, uint price) constant returns (bool successful, bytes32 id) {
    uint iCount = listMarketOrders[assetId].length;

    for (uint i=0;i<iCount;i++) {
      MarketOrder mm = listMarketOrders[assetId][i];
      if (mm.orderType == orderType && mm.quantity == quantity && mm.price == price && mm.active == true) {
        return (true,mm.orderId);
      }
    }

    return (false,0);
  }

  function getMarketOrderById(uint assetId, bytes32 orderId) internal returns (uint index, MarketOrder marketOrder) {
    uint iCount = listMarketOrders[assetId].length;

    for (uint i=0;i<iCount;i++) {
      MarketOrder mm = listMarketOrders[assetId][i];
      if (mm.orderId == orderId) {
        return (i,mm);
      }
    }

    MarketOrder memory x;
    return (0,x);
  }
}
