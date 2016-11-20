# WallStreet

Project created for B9 Week4 Project. It's a little stock market simulator.

How does it works:

1. WallStreetToken
    - This project uses a custom WallStreetToken (ERC20 compatible)
    - The contract owner has 1000000000 tokens when he deploys the contract
2. WallStreetAssets
    - There are 3 assets to trade deployed with the initial contract. 
    - Only the contract owner can add or remove assets
    - It's impossible to remove an asset it has market orders pending to execute
3. WallStreetMarket
    - You can create an order to buy an asset setting the buying price you desire. Same to sell an asset
    - You can create a direct order to the market. You go to the market pending orders, search the best price for the order you want and
      execute it directly
4. WallStreetListAssets
    - Keeps balance of the assets you own

Detected improvements:

1. Connect with an external system to get assets price