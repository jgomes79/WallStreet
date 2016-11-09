

app.factory('AssetService', function() {
  var assetsCount;
  var assetsIds;

  return {
    getAssetsCount: getAssetsCount,
    setAssetsCount: setAssetsCount,
    getAssetsIds: getAssetsIds,
    setAssetsIds: setAssetsIds,
  };

  function setAssetsCount(count) {
    assetsCount = count;
  }

  function getAssetsCount() {
    return assetsCount;
  }

  function setAssetsIds(ids) {
    assetsIds = ids;
  }

  function getAssetsIds() {
    return assetsIds;
  }
});
