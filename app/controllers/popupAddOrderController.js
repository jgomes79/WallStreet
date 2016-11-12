app.controller('popupAddOrderController', ['$scope','ngDialog','AccountService','MarketService', function ($scope, ngDialog, AccountService, MarketService) {

  $scope.varDialog;
  $scope.newOrder;
  $scope.assetId;
  $scope.orderType;

  $scope.openModal = function(orderType,assetId) {

    $scope.orderType = orderType;
    $scope.assetId = assetId;
    $scope.varDialog = ngDialog.open({
      template: 'views/popupAddOrder.html',
      controller: 'popupAddOrderController',
      className: 'ngdialog-theme-plain',
      scope: $scope
    });
  };

  $scope.sendOrder = function() {
    MarketService.postOrderToMarket($scope.orderType,$scope.assetId,$scope.newOrder.quantity,$scope.newOrder.price,{from: AccountService.getActiveAccount(), gas: 3000000});
  };

  $scope.closeModal = function() {
    $scope.varDialog.close();
  }
}]);
