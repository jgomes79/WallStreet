var app = angular.module('wallStreetApp', ['ngRoute','ngDialog','ui-notification']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/accounts', {
          templateUrl : 'views/accounts.html',
          controller  : 'wallStreetAccountsController'
      })
      .when('/assets', {
          templateUrl : 'views/assets.html',
          controller  : 'wallStreetAssetsController'
      })
      .when('/market', {
          templateUrl : 'views/market.html',
          controller  : 'wallStreetMarketController'
      })
      .otherwise({
          redirectTo: '/accounts'
      });
}]);

app.config(function(NotificationProvider) {
            NotificationProvider.setOptions({
                delay: 5000,
                startTop: 20,
                startRight: 10,
                verticalSpacing: 20,
                horizontalSpacing: 20,
                positionX: 'right',
                positionY: 'bottom'
            });
});
