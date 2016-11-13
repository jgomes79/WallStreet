pragma solidity ^0.4.2;

contract WallStreetMarketI {
  // Operations: Buy or Sell
  enum OrderType { Buy, Sell }

  // Struct to define the market orders
  struct MarketOrder {
    OrderType orderType;
    address from;
    uint quantity;
    uint price;
    uint datetime;
    bool active;
    bytes32 orderId;
  }

  function getMarketOrdersCountByAsset(uint assetId) constant returns (uint count);

  function getMarketOrderByAsset(uint assetId, uint index) constant returns (OrderType orderType, address from, uint quantity, uint price, uint datetime, bool active, bytes32 orderId);

  function postOrderToMarket(OrderType orderType, uint assetId, uint quantity, uint price) returns (bool successful);

  function executeOrderDirectInTheMarket(OrderType orderType, uint assetId) returns (bool successful);

  function executeOrder (uint assetId, bytes32 orderId) returns (bool successful);
}
