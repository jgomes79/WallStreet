module.exports = {
  build: {
    "index.html": "index.html",
    "header.html": "header.html",
    "app.js": "app.js",
    "services.js": "services.js",
    "utils.js": "utils.js",

    "views/": "views/",
    "views/assets.html": "views/assets.html",
    "views/market.html": "views/market.html",
    "views/accounts.html": "views/accounts.html",

    "controllers/": "controllers/",
    "controllers/wallStreetAccountsController.js": "controllers/wallStreetAccountsController.js",
    "controllers/wallStreetAssetsController.js": "controllers/wallStreetAssetsController.js",
    "controllers/wallStreetCoinController.js": "controllers/wallStreetCoinController.js",
    "controllers/wallStreetMarketController.js": "controllers/wallStreetMarketController.js",

    "app.css": [
      "content/css/app.css"
    ],

    "content/": "content/",
    "content/css/": "content/css/",
    "content/images/": "content/images/",

    "content/css/app.css": "content/css/app.css",

    "lib/": "lib/",
    "lib/angular.min.js": "lib/angular.min.js",
    "lib/angular-route.min.js": "lib/angular-route.min.js",

    "services/": "services/",
    "services/accountService.js": "services/accountService.js",
    "services/assetService.js": "services/assetService.js"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
