

app.controller("wallStreetAssetsController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService', 'AssetService', function($scope, $location, $http, $q, $window, $timeout, AccountService, AssetService) {

  $scope.assets = [];
  $scope.asset;
  $scope.newAsset;

	$scope.addAsset = function() {
    console.log()
		WallStreetAssets.deployed().addAsset($scope.newAsset.assetType,$scope.newAsset.name,$scope.newAsset.symbol,$scope.newAsset.id, {from: AccountService.getActiveAccount(), gas: 3000000})
			.then(function (tx) {
				return web3.eth.getTransactionReceiptMined(tx);
			})
			.then(function (receipt) {
				console.log("asset added");
        $scope.getAllAssets();
        $scope.apply();
			});
	};

  $scope.removeAsset = function(id) {
    WallStreetAssets.deployed().removeAsset(id)
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("asset removed");
      });
  };

  $scope.getAsset = function(id) {
    WallStreetAssets.deployed().getAsset(id).call()
      .then(function (assetType,name,symbol) {
        $scope.asset = {
                          id: id,
                          name: name,
                          symbol: symbol,
                          assetType: assetType
                       };
          })
      .catch(function (e) {
        console.error(e);
      });
  };

	$scope.getAllAssets = function() {
    $scope.assets = [];
    $scope.assetIds = [];

		WallStreetAssets.deployed().getAssetsCount.call()
			.then(function (count) {
        AssetService.setAssetsCount(count.valueOf());
        if (count.valueOf() > 0) {
  			  for (var i = 0; i < count.valueOf(); i++) {
  				  WallStreetAssets.deployed().assetIds(i)
  						.then(function (id) {
  						  return WallStreetAssets.deployed().assets(id.valueOf())
  								.then(function (asset) {
  									$timeout(function () {
  										$scope.assets.push({
                        id: id.valueOf(),
  											name: asset[1],
  											symbol: asset[2],
                        assetType: asset[0]
  										});
                      $scope.assetIds.push(id.valueOf());
  									});
  								})
  								.catch(function (e) {
  									console.error(e);
  								});
  							})
  						.catch(function (e) {
  							console.error(e);
  						});
  					}
          }
			});
      AssetService.setAssetsIds($scope.assetIds);
	};
}]);
