

app.controller("wallStreetMarketController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService', 'AssetService', function($scope, $location, $http, $q, $window, $timeout, AccountService, AssetService) {

  $scope.marketOrders = [];
  $scope.newOrder;

  $scope.getAllMarketOrders = function() {
    $scope.marketOrders = [];
    var assetsIds = AssetService.getAssetsIds();
    var assetsLength = AssetService.getAssetsCount();

    for (var i = 0; i < assetsLength; i++) {
        WallStreetMarket.deployed().getMarketOrdersCountByAsset(assetsIds[i])
  		    .then(function (count) {
            for (var j=0; j< count; j++) {
              console.log("Found " + count + " orders for asset: " + assetsIds[i]);
              return WallStreetMarket.deployed().getMarketOrderByAsset(assetsIds[i],j)
                .then(function (orderType, from, quantity, price, datetime) {
                  $scope.marketOrders.push({
                    orderType: orderType,
                    from: from,
                    quantity: quantity,
                    price: price,
                    datetime: datetime
                  });
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
	};

  $scope.postOrderToMarket = function() {
    WallStreetMarket.deployed().postOrderToMarket($scope.newOrder.orderType,$scope.newOrder.assetId,$scope.newOrder.quantity,$scope.newOrder.price, {from: AccountService.getActiveAccount(), gas: 3000000})
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (successful) {
          console.log("Order posted to market propertly");
      })
      .catch(function (e) {
        console.log("error posting order to market");
      });
  };

  $scope.executeOrderDirectInTheMarket = function() {

  };

}]);
