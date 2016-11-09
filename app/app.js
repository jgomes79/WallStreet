var app = angular.module('wallStreetApp', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/assets', {
            templateUrl : 'views/assets.html',
            controller  : 'wallStreetAssetsController'
        })
        .when('/market', {
            templateUrl : 'views/market.html',
            controller  : 'wallStreetMarketController'
        })
        .when('/accounts', {
            templateUrl : 'views/accounts.html',
            controller  : 'wallStreetAccountsController'
        })
        .otherwise({
            redirectTo: '/accounts'
        });
}]);
