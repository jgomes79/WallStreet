app.controller("wallStreetAccountsController", [ '$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService','Notification', function($scope, $location, $http, $q, $window, $timeout, AccountService, Notification) {

  $scope.accounts = [];
  $scope.contractAccount;
  $scope.activeAccount;
  $scope.activeAccountBalance;
  $scope.amountToAdd;

  $scope.$on('$viewContentLoaded', function(){
    initUtils(web3);

    if(typeof mist !== 'undefined') {
      createMistMenu(mist,$location);
    }
  });

	$scope.getAllAccounts = function() {
		web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
			  console.log("There was an error fetching your accounts.");
			  return;
			}

      if (accs && accs.length > 0) {
        $scope.accounts = accs;
        $scope.activeAccount = accs[0];
        $scope.contractAccount = accs[0];
        $scope.getAccountBalance();
      } else {
        if(typeof mist !== 'undefined') {
          // If there's no account and we are using Mist, create one in mist
          mist.requestAccount(function(e, account) {
            if(!e) {
              $scope.accounts = account;
              $scope.activeAccount = account;
              $scope.contractAccount = account;
              $scope.getAccountBalance();
            }
          });
        }
      }
    });
  };

  $scope.getAccountBalance = function() {
    WallStreetToken.deployed().balanceOf.call($scope.activeAccount)
      .then(function (balance) {
        $scope.activeAccountBalance = balance;
        $scope.$apply();
      })
      .catch(function (e) {
        console.error(e);
      });
  };

  $scope.depositMoney = function() {
    var wallStreetToken = WallStreetToken.deployed();
    var events = wallStreetToken.allEvents('latest',function(error, log) {
      if (!error) {
        var args = log.args;
        var amount = args._value;
        Notification("Added " + amount + " to account");
        $scope.getAccountBalance();
      }
      events.stopWatching();
    });

    wallStreetToken.transfer($scope.activeAccount,$scope.amountToAdd,{from:$scope.contractAccount, gas: 3000000})
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
