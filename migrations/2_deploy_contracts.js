module.exports = function(deployer) {

  deployer.deploy(WallStreetToken,1000000000,"WSCoin",0,"WWSS")
  	.then(function() {
      return deployer.deploy(WallStreetListAssets)
        .then(function() {
          return deployer.deploy(WallStreetMarket, WallStreetToken.address, WallStreetListAssets.address)
            .then(function() {
              return deployer.deploy(WallStreetAssets, WallStreetMarket.address, WallStreetListAssets.address);
            })
        })
  	});
};
