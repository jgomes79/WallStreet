app.factory('AssetService', function() {
  var assetsCount;
  var assetsIds;

  return {
    getAssetsCount: getAssetsCount,
    setAssetsCount: setAssetsCount,
    getAssetsIds: getAssetsIds,
    setAssetsIds: setAssetsIds,
    getAssetDescription: getAssetDescription
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

  function getAssetDescription(id) {
    if (id == 0)  return 'Stock';
    if (id == 1)  return 'Option';
    if (id == 2)  return 'Future';
  }
});
