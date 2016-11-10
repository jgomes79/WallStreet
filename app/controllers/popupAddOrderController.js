app.controller('popupAddOrderController', ['$scope','$rootScope','ngDialog', function ($scope, $rootScope, ngDialog) {

  $scope.varDialog;
  $scope.newOrder;

  $scope.openModal = function() {
    $scope.varDialog = ngDialog.open({
      template: 'views/popupAddOrder.html',
      controller: 'popupAddOrderController',
      className: 'ngdialog-theme-plain',
      scope: $scope
    });
  };

  $scope.sendOrder = function() {
    $rootScope.$emit("callPostOrderToMarket", {});

    //$scope.varDialog.close();
  }

}]);
