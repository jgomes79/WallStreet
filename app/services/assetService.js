app.factory('AssetService', function() {
  var assetsCount;
  var assetsIds;
  var assets;

  return {
    getAssetsCount: getAssetsCount,
    setAssetsCount: setAssetsCount,
    getAssetsIds: getAssetsIds,
    setAssetsIds: setAssetsIds,
    getAssetTypeDescription: getAssetTypeDescription,
    setAssets: setAssets,
    getAssets: getAssets,
    getAssetNameById: getAssetNameById
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

  function getAssetTypeDescription(id) {
    if (id == 0)  return 'Stock';
    if (id == 1)  return 'Option';
    if (id == 2)  return 'Future';
  }

  function setAssets(_assets) {
    assets = _assets;
  }

  function getAssets() {
    return assets;
  }

  function getAssetNameById(id) {
    for (var i=0;i<assetsCount;i++) {
      if (assets[i].id == id) return assets[i].name;
    }

    return "";
  }
});
