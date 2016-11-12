app.controller("wallStreetAssetsController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService', 'AssetService','Notification', function($scope, $location, $http, $q, $window, $timeout, AccountService, AssetService, Notification) {

  $scope.assets = [];
  $scope.asset;
  $scope.newAsset;

  event OnLogAssetExists(uint id);
	event OnLogAssetAdded(AssetType assetType, string name, string symbol, uint id);
  event OnLogAssetRemoved(uint id);

	$scope.addAsset = function() {
    var wallStreetAssets = WallStreetAssets.deployed();
    var events = wallStreetAssets.allEvents('latest',function(error, log) {
      if (!error) {
        switch (log.event) {
          case 'OnLogAssetExists':
            Notification("There's an asset with the same id");
            break;
          case 'OnLogAssetAdded':
            Notification("Asset added");
            $scope.getAllAssets();
            $scope.$apply();
            break;
          default:
            break;
      }
      events.stopWatching();
    });

		wallStreetAssets.addAsset($scope.newAsset.assetType,$scope.newAsset.name,$scope.newAsset.symbol,$scope.newAsset.id, {from: AccountService.getActiveAccount(), gas: 3000000})
			.then(function (tx) {
				return web3.eth.getTransactionReceiptMined(tx);
			})
			.then(function (receipt) {
          console.log("Asset added");
			})
      .catch(function (e) {
        console.log("error adding an asset: " + e);
      });
	};

  $scope.removeAsset = function(id) {
    var wallStreetAssets = WallStreetAssets.deployed();
    var events = wallStreetAssets.allEvents('latest',function(error, log) {
      if (!error) {
          Notification("Asset removed");
          $scope.getAllAssets();
          $scope.$apply();
      }
      events.stopWatching();
    });

    wallStreetAssets.removeAsset(id)
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
  				  WallStreetAssets.deployed().assetIds.call(i)
  						.then(function (id) {
  						  return WallStreetAssets.deployed().assets.call(id.valueOf())
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
			})
      .catch(function (e) {
        console.error(e);
      });
      AssetService.setAssetsIds($scope.assetIds);
      AssetService.setAssets($scope.assets);
	};

  $scope.getAssetTypeDescription = function(id) {
    return AssetService.getAssetTypeDescription(id);
  };

}]);
