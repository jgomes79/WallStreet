

app.controller("wallStreetAccountsController", [ '$scope', '$location', '$http', '$q', '$window', '$timeout', 'AccountService', function($scope, $location, $http, $q, $window, $timeout, AccountService) {

  $scope.accounts = [];
  $scope.activeAccount;
  $scope.contractAccount;

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
			$scope.contractAccount = accs[0];
      $scope.activeAccount = $scope.contractAccount;
      $scope.$apply();
	   });
  };

  $scope.loginWithAccount = function() {
    AccountService.setActiveAccount($scope.activeAccount);

    $location.path('/assets');
  };

  $scope.accountChanged = function(account) {
    
  }

}]);
