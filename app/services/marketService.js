app.factory('MarketService', function(Notification) {

  return {
    postOrderToMarket: postOrderToMarket,
    getOrderTypeDescription: getOrderTypeDescription
  };

  function postOrderToMarket(orderType,assetId,quantity,price,other) {
    var wallStreetMarket = WallStreetMarket.deployed();
    var events = wallStreetMarket.allEvents('latest',function(error, log) {
      if (!error) {
        switch (log.event) {
          case 'OnLogNotEnoughMoney':
            Notification("Not enough money in account to buy");
            break;
          case 'OnLogNotEnoughAssets':
            Notification("Not assets to sell");
            break;
          case 'OnLogOrderPostedToTheMarket':
            Notification("Your order has been posted to the market propertly");
            break;
          case 'OnLogExecuteOrder':
            Notification("Your order has been executed in the market");
            break;
          default:
            break;
        }
      }
      events.stopWatching();
    });

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
