module.exports = {
  build: {
    "index.html": "index.html",
    "header.html": "header.html",
    "app.js": "app.js",
    "utils.js": "utils.js",

    "views/": "views/",
    "views/assets.html": "views/assets.html",
    "views/market.html": "views/market.html",
    "views/accounts.html": "views/accounts.html",
    "views/popupAddOrder.html": "views/popupAddOrder.html",

    "controllers/": "controllers/",
    "controllers/wallStreetAccountsController.js": "controllers/wallStreetAccountsController.js",
    "controllers/wallStreetAssetsController.js": "controllers/wallStreetAssetsController.js",
    "controllers/wallStreetMarketController.js": "controllers/wallStreetMarketController.js",

    "content/": "content/",
    "content/css/": "content/css/",
    "content/images/": "content/images/",

    "content/css/app.css": "content/css/app.css",
    "content/css/bootstrap.min.css": "content/css/bootstrap.min.css",
    "content/css/ngDialog.min.css": "content/css/ngDialog.min.css",
    "content/css/ngDialog-theme-plain.min.css": "content/css/ngDialog-theme-plain.min.css",
    "content/css/angular-ui-notification.min.css": "content/css/angular-ui-notification.min.css",

    "lib/": "lib/",
    "lib/angular.min.js": "lib/angular.min.js",
    "lib/angular-route.min.js": "lib/angular-route.min.js",
    "lib/ngDialog.min.js": "lib/ngDialog.min.js",
    "lib/angular-ui-notification.min.js": "lib/angular-ui-notification.min.js",

    "services/": "services/",
    "services/accountService.js": "services/accountService.js",
    "services/assetService.js": "services/assetService.js",
    "services/marketService.js": "services/marketService.js"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
