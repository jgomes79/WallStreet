// Found here https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
  var transactionReceiptAsync;
  interval = interval ? interval : 500;
  transactionReceiptAsync = function(txnHash, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHash);
      if (receipt == null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHash, resolve, reject);
        }, interval);
      } else {
        resolve(receipt);
      }
    } catch(e) {
      reject(e);
    }
  };

  return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
  });
};

// Found here https://gist.github.com/xavierlepretre/afab5a6ca65e0c52eaf902b50b807401
var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

// Found here https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
var expectedExceptionPromise = function (action, gasToUse) {
  return new Promise(function (resolve, reject) {
      try {
        resolve(action());
      } catch(e) {
        reject(e);
      }
    })
    .then(function (txn) {
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      // We are in Geth
      assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
    })
    .catch(function (e) {
      if ((e + "").indexOf("invalid JUMP") > -1) {
        // We are in TestRPC
      } else {
        throw e;
      }
    });
};

contract('WallStreet', function(accounts) {

  it("should have initial balance", function() {
    var wallStreet = WallStreetCoin.deployed();

    return wallStreet.getMoneyInAccount.call(accounts[0])
      .then(function(balance) {
        assert.equal(balance.valueOf(), 100000000, "There's no 100000000 in initial balance");
      })
  });

  it("should start with 3 stocks", function() {
    var wallStreet = WallStreetAssets.deployed();

    return wallStreet.getAssetsCount.call()
            .then(function(count) {
              assert.equal(count.valueOf(), 3, "There's no 3 assets starting");
            });
  });

  it("should be possible to add an asset", function() {
    var wallStreet = WallStreetAssets.deployed();

    return wallStreet.addAsset(1, "Facebook", "FCBK", 4)
            .then(function(successful) {
              assert.isTrue(successful, "should be possible to add a product");
              return wallStreet.addAsset(1, "Facebook", "FCBK", 4);
            })
            .then(function(tx) {
              return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function(receipt) {
              console.log(receipt);
            });
  });
});
