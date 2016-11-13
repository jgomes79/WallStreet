app.controller("wallStreetMarketController", ['$scope', '$location', '$http', '$q', 'AccountService', 'AssetService', 'MarketService','Notification', function($scope, $location, $http, $q, AccountService, AssetService, MarketService, Notification) {

  $scope.marketOrders = [];
  $scope.newOrder;

  $scope.getAllMarketOrders = function() {
    $scope.marketOrders = [];
    var assetsIds = AssetService.getAssetsIds();
    var assetsLength = AssetService.getAssetsCount();

    for (var i = 0; i < assetsLength; i++) {
        getMarketOrdersByAsset(assetsIds[i]);
  	}
	};

  function getMarketOrdersByAsset(assetId) {
    WallStreetMarket.deployed().getMarketOrdersCountByAsset.call(assetId)
      .then(function (count) {
        for (var j=0; j< count; j++) {
          WallStreetMarket.deployed().getMarketOrderByAsset.call(assetId,j)
            .then(function (marketOrder) {
              if (marketOrder[5] == true) {
                $scope.marketOrders.push({
                  orderType: marketOrder[0],
                  from: marketOrder[1],
                  quantity: marketOrder[2],
                  price: marketOrder[3],
                  datetime: marketOrder[4],
                  assetId: assetId,
                  active: marketOrder[5],
                  orderId: marketOrder[6]
                });

                $scope.$apply();
              }
            })
            .catch(function (e) {
              console.error(e);
            });
        }
      })
      .catch(function (e) {
        console.error(e);
      });
  }

  $scope.postOrderToMarket = function() {
    MarketService.postOrderToMarket($scope.newOrder.orderType,$scope.newOrder.assetId,$scope.newOrder.quantity,$scope.newOrder.price,{from: AccountService.getActiveAccount(), gas: 3000000});
  };

  $scope.executeOrder = function(index) {
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
          case 'OnLogExecuteOrder':
            var args = log.args;
            var finalPrice = args.quantity * args.price;
            Notification("Your order has been executed in the market with " + finalPrice + " of cost");
            $scope.getAllMarketOrders();
            $scope.$apply();
            break;
          default:
            break;
        }
      }
      events.stopWatching();
    });

    wallStreetMarket.executeOrder($scope.marketOrders[index].assetId, $scope.marketOrders[index].orderId, {from: AccountService.getActiveAccount(), gas: 3000000})
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

  $scope.executeOrderDirectInTheMarket = function(orderType, assetId) {
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
          case 'OnLogExecuteOrder':
            var args = log.args;
            var finalPrice = args.quantity * args.price;
            Notification("Your order has been executed in the market with " + finalPrice + " of cost");

            $scope.getAllMarketOrders();
            $scope.$apply();
            break;
          default:
            break;
        }
      }
      events.stopWatching();
    });

    wallStreetMarket.executeOrderDirectInTheMarket(orderType, assetId, {from: AccountService.getActiveAccount(), gas: 3000000})
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("Order posted to market propertly");
      })
      .catch(function (e) {
        console.log("error posting order to market: " + e);
      });
  }

  $scope.getOrderTypeDescription = function(id) {
    return MarketService.getOrderTypeDescription(id);
  };

  $scope.getAssetNameById = function(id) {
    return AssetService.getAssetNameById(id);
  };

  $scope.getAssets = function() {
    return AssetService.getAssets();
  }

}]);
