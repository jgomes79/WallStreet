# WallStreet

Project created for B9 Week4 Project. It's a little stock market simulator.

How does it works:

1. WallStreetToken
    - This project uses a custom WallStreetToken (ERC20 compatible)
    - The contract owner has 1000000000 tokens when he deploys the contract
2. WallStreetAssets
    - There are 3 assets to trade deployed with the initial contract. 
    - When a new asset is created, contract owner has 10000 asset amount in this ListAssets
    - Only the contract owner can add or remove assets
    - It's impossible to remove an asset it has market orders pending to execute
3. WallStreetMarket
    - You can create an order to buy an asset setting the buying price you desire. Same to sell an asset
    - You can create a direct order to the market. You go to the market pending orders, search the best price for the order you want and
      execute it directly
4. WallStreetListAssets
    - Keeps balance of the assets you own

Executing and working:

1. First use the contract owner account to post sell orders because is the only account who owns assets
2. Use the accounts page to select accounts with no balance and deposit tokens in this accounts. The tokens are transfered from owner account
3. Use these accounts to buy assets from the market. Once an account owns assets, it can sell the assets to other account creating a little "stock market".

Detected improvements:

1. Now the asset price is set in each operation. It will be an improvment to connect with an external system to get assets price (¿Oraclize?)
2. Restrict each asset to be traded in a limited timetable

