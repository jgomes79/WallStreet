module.exports = function(deployer) {

  deployer.deploy(WallStreetCoin)
  	.then(function() {
      return deployer.deploy(WallStreetListAssets)
        .then(function() {
          return deployer.deploy(WallStreetMarket, WallStreetCoin.address, WallStreetListAssets.address)
            .then(function() {
              return deployer.deploy(WallStreetAssets, WallStreetMarket.address, WallStreetListAssets.address);
            })
        })
  	});

/*
  deployer.deploy(WallStreetCoin);
  deployer.deploy(WallStreetListAssets);
  deployer.deploy(WallStreetMarket, WallStreetCoin.address, WallStreetListAssets.address);
  deployer.deploy(WallStreetAssets, WallStreetMarket.address, WallStreetListAssets.address);
*/
};
