

app.controller("wallStreetMarketController", ['$scope', '$location', '$http', '$q', 'AccountService', 'AssetService', 'MarketService', function($scope, $location, $http, $q, AccountService, AssetService, MarketService) {

  $scope.marketOrders = [];
  $scope.newOrder;

  $scope.getAllMarketOrders = function() {
    $scope.marketOrders = [];
    var assetsIds = AssetService.getAssetsIds();
    var assetsLength = AssetService.getAssetsCount();

    for (var i = 0; i < assetsLength; i++) {
        getIndividualAsset(assetsIds[i]);
  	}
	};

  function getIndividualAsset(assetId) {
    WallStreetMarket.deployed().getMarketOrdersCountByAsset(assetId)
      .then(function (count) {
        for (var j=0; j< count; j++) {
          console.log("Found " + count + " orders for asset: " + assetId);
          WallStreetMarket.deployed().getMarketOrderByAsset(assetId,j)
            .then(function (marketOrder) {
              $scope.marketOrders.push({
                orderType: marketOrder[0],
                from: marketOrder[1],
                quantity: marketOrder[2],
                price: marketOrder[3],
                datetime: marketOrder[4],
                assetId: assetId
              });

              $scope.$apply();
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
    WallStreetMarket.deployed().executeOrder($scope.marketOrders[index].orderType, $scope.marketOrders[index].assetId, index, {from: AccountService.getActiveAccount(), gas: 3000000})
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("Order posted to market propertly");
        $scope.getAllMarketOrders();
        $scope.$apply();
      })
      .catch(function (e) {
        console.log("error posting order to market: " + e);
      });
  };

  $scope.getOrderTypeDescription = function(id) {
    return MarketService.getOrderTypeDescription(id);
  };

}]);
