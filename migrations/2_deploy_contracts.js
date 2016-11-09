module.exports = function(deployer) {
  deployer.deploy(WallStreetAssets);
  deployer.deploy(WallStreetCoin)
    	.then(function () {
    		return deployer.deploy(WallStreetMarket, WallStreetCoin.address);
    	});  
};
