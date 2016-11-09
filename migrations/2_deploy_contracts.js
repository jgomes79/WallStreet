module.exports = function(deployer) {
  deployer.deploy(WallStreetAssets).then(function() {
    deployer.deploy(WallStreetCoin).then(function() {
      return deployer.deploy(WallStreet,WallStreetAssets.address,WallStreetCoin.address);
    })
  })
};
