app.service('MarketService', function() {

  return {
    postOrderToMarket: postOrderToMarket,
    getOrderTypeDescription: getOrderTypeDescription
  };

  function postOrderToMarket(orderType,assetId,quantity,price,other) {
    WallStreetMarket.deployed().postOrderToMarket(orderType,assetId,quantity,price, other)
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("Order posted to market propertly");
      })
      .catch(function (e) {
        console.log("error posting order to market: " + e);
      });
  };

  function getOrderTypeDescription(id) {
    if (id == 0)  return 'Buy';
    if (id == 1)  return 'Sell';
  }
});
