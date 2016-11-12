app.controller("wallStreetAccountsController", [ '$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService','Notification', function($scope, $location, $http, $q, $window, $timeout, AccountService, Notification) {

  $scope.accounts = [];
  $scope.activeAccount;
  $scope.activeAccountBalance;
  $scope.amountToAdd;

	$scope.getAllAccounts = function() {
    initUtils(web3);
		web3.eth.getAccounts(function(err, accs) {
			if (err != null) {
			  console.log("There was an error fetching your accounts.");
			  return;
			}

			if (accs.length == 0) {
			  console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
			  return;
			}

      $scope.accounts = accs;
      $scope.activeAccount = accs[0];
      $scope.getAccountBalance();
	   });
  };

  $scope.getAccountBalance = function() {
    WallStreetCoin.deployed().getMoneyInAccount.call($scope.activeAccount)
      .then(function (balance) {
        $scope.activeAccountBalance = balance;
        $scope.$apply();
      })
      .catch(function (e) {
        console.error(e);
      });
  };

  $scope.depositMoney = function() {
    var wallStreetCoin = WallStreetCoin.deployed();
    var events = wallStreetCoin.allEvents('latest',function(error, log) {
      if (!error) {
        var args = log.args;
        var amount = args.amount;
        Notification("Added " + amount + " to account");
        $scope.getAccountBalance();
      }
      events.stopWatching();
    });

    wallStreetCoin.depositMoneyToAccount($scope.activeAccount,$scope.amountToAdd,{from:$scope.activeAccount, gas: 3000000})
      .then(function (tx) {
        return web3.eth.getTransactionReceiptMined(tx);
      })
      .then(function (receipt) {
        console.log("Deposit money transaction completed");
      })
      .catch(function (e) {
        console.log("error changing balance: " + e);
      });
  };

  $scope.loginWithAccount = function() {
    AccountService.setActiveAccount($scope.activeAccount);

    $location.path('/assets');
  };

  $scope.accountChanged = function(account) {
    $scope.activeAccount = account;
    $scope.getAccountBalance();
  };

}]);
