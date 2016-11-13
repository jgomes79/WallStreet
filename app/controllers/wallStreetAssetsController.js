app.controller("wallStreetAssetsController", ['$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService', 'AssetService','Notification', function($scope, $location, $http, $q, $window, $timeout, AccountService, AssetService, Notification) {

  $scope.assets = [];
  $scope.asset;
  $scope.newAsset;
  $scope.assetIdToDelete;

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

  $scope.removeAsset = function() {
    var wallStreetAssets = WallStreetAssets.deployed();
    var events = wallStreetAssets.allEvents('latest',function(error, log) {
      if (!error) {
        switch (log.event) {
          case 'OnLogCantRemoveAssetBecauseOrdersPending':
            Notification("There's orders pending for this asset. Please, execute them first and remove the asset later");
            break;
          case 'OnLogAssetRemoved':
          Notification("Asset removed");
          $scope.getAllAssets();
          $scope.$apply();
            break;
          default:
            break;
        }
      }
      events.stopWatching();
    });

    wallStreetAssets.removeAsset($scope.assetIdToDelete, {from: AccountService.getActiveAccount(), gas: 3000000})
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("asset removed");
      });
  };

  $scope.getAsset = function(id) {
    WallStreetAssets.deployed().getAsset.call(id)
      .then(function (assetType,name,symbol,active) {
        $scope.asset = {
                          id: id,
                          name: name,
                          symbol: symbol,
                          assetType: assetType,
                          active: active
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
                      if (asset[3] == true) {
                        $scope.assets.push({
                          id: id.valueOf(),
                          name: asset[1],
                          symbol: asset[2],
                          assetType: asset[0]
                        });
                        $scope.assetIds.push(id.valueOf());
                      }
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
