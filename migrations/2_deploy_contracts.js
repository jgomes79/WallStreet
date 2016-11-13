module.exports = function(deployer) {
  deployer.deploy(WallStreetCoin)
    	.then(function () {
    		return deployer.deploy(WallStreetMarket, WallStreetCoin.address)
          .then(function () {
            return deployer.deploy(WallStreetAssets, WallStreetMarket.address);
          })
    	});
};
