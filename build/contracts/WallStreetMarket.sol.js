var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("WallStreetMarket error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("WallStreetMarket error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("WallStreetMarket contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of WallStreetMarket: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to WallStreetMarket.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: WallStreetMarket not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "assetId",
            "type": "uint256"
          }
        ],
        "name": "lookForBestPrice",
        "outputs": [
          {
            "name": "index",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "assetId",
            "type": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "postOrderToMarket",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "listAssetsInMarketCount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wallStreetCoin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "assetId",
            "type": "uint256"
          }
        ],
        "name": "getMarketOrdersCountByAsset",
        "outputs": [
          {
            "name": "count",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "assetId",
            "type": "uint256"
          },
          {
            "name": "iIndex",
            "type": "uint256"
          }
        ],
        "name": "executeOrder",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "assetId",
            "type": "uint256"
          },
          {
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "getMarketOrderByAsset",
        "outputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "from",
            "type": "address"
          },
          {
            "name": "quantity",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          },
          {
            "name": "datetime",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "assetId",
            "type": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "lookforMatch",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wallStreetAssets",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "listMarketOrders",
        "outputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "from",
            "type": "address"
          },
          {
            "name": "quantity",
            "type": "uint256"
          },
          {
            "name": "price",
            "type": "uint256"
          },
          {
            "name": "datetime",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "orderType",
            "type": "uint8"
          },
          {
            "name": "assetId",
            "type": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256"
          }
        ],
        "name": "executeOrderDirectInTheMarket",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_wallStreetAssets",
            "type": "address"
          },
          {
            "name": "_wallStreetCoin",
            "type": "address"
          }
        ],
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "orderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnOrderPostedToTheMarket",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "orderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnExecuteOrderDirectInTheMarket",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604081815280610bf7833960a090525160805160038054600160a060020a0319908116909317905560028054909216179055610bb6806100416000396000f36060604052361561008d5760e060020a600035046308ef576381146100925780630a240250146100a557806310b436c2146101505780632b7358be1461016d5780632be4f1f2146101845780633492e7e5146101ae5780635c8a9a94146101c457806369d7c8ba14610239578063748eef3b14610252578063ad7e0cda14610269578063e0baee03146102cf575b610002565b346100025761019c6004356024356102ea565b346100025761036f60043560243560443560643560008282028180878114156105765760408051600254602091820184905282517f3e764c2900000000000000000000000000000000000000000000000000000000815232600160a060020a039081166004830152935187949290921692633e764c299260248381019382900301818887803b156100025760325a03f11561000257505060405151919091101590506104c5576107c9565b346100025761019c60043560016020526000908152604090205481565b3461000257610383600254600160a060020a031681565b34610002576004356000908152600160205260409020545b60408051918252519081900360200190f35b346100025761036f6004356024356044356103a8565b34610002576104776004356024356000828152602081905260408120805482918291829182918291908890811015610002575090525050602090206004939093029092018054600182015460028301546003939093015460ff831697610100909304600160a060020a03169650909450919250565b34610002576104aa6004356024356044356064356104cd565b3461000257610383600354600160a060020a031681565b346100025761047760043560243560006020819052828152604090208054829081101561000257906000526020600020906004020160005080546001820154600283015460039093015460ff83169550610100909204600160a060020a03169350919085565b346100025761036f6004356024356044356000600061039f85855b600081815260016020526040812054819081908180805b8383101561054c57600088815260208190526040902080548490811015610002579060005260206000209060040201600050600181015460028201549193500290506000831415610350579450845b6000891415610559578581101561036a5794509092508290845b61056a565b604080519115158252519081900360200190f35b60408051600160a060020a039092168252519081900360200190f35b9050610baa8585835b600082815260208190526040812080548291829185908110156100025790600052602060002090600402016000506002810154600182015491935002905060008614156108a05780600260009054906101000a9004600160a060020a0316600160a060020a0316633e764c29326000604051602001526040518260e060020a0281526004018082600160a060020a03168152602001915050602060405180830381600087803b156100025760325a03f11561000257505060405151919091101590506109375760009250610897565b60408051958652600160a060020a0390941660208601528484019290925260608401526080830152519081900360a00190f35b60408051921515835260208301919091528051918290030190f35b610606888888885b600083815260016020526040812054819081805b82821015610b8a57600088815260208190526040902080548390811015610002579060005260206000209060040201600050805490915060ff168914801561052c5750600181015487145b801561053b5750600281015486145b15610b9e5760018294509450610b92565b5092979650505050505050565b8581111561056a5794509092508290845b60019290920191610301565b85600260009054906101000a9004600160a060020a0316600160a060020a031663e5cb3256328a6000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100025760325a03f11561000257505060405151919091101590506104c557600093506107c9565b91509150811561061b5761069a8888836103a8565b600087815260208190526040902080546001810180835582818380158290116106a0576004028160040283600052602060002091820191016106a091905b808211156107d457805474ffffffffffffffffffffffffffffffffffffffffff19168155600060018201819055600282018190556003820155600401610659565b506107c9565b50505091909060005260206000209060040201600060a0604051908101604052808c81526020013281526020018a815260200189815260200142815260200150909190915060008201518160000160006101000a81548160ff0219169083021790555060208201518160000160016101000a815481600160a060020a0302191690830217905550604082015181600101600050556060820151816002016000505560808201518160030160005055505050600160005060008881526020019081526020016000206000818150548092919060010191905055507f441861bc50ab19e6309dd123a12a22306055035ee297a07bf3c5171b3497b53b888888886040518085815260200184815260200183815260200182815260200194505050505060405180910390a15b505050949350505050565b5090565b60006000506000868152602001908152602001600020600050848154811015610002579060005260206000209060040201600050805474ffffffffffffffffffffffffffffffffffffffffff19168155600060018281018290556002838101839055600390930191909155830154908301546040805189815260208101899052808201939093526060830191909152517f7074e8044ae07406d7ed08e6eb16e4d0ffff4d92db330c683fedf9d535119ebb9181900360800190a1600192505b50509392505050565b8160010160005054600260009054906101000a9004600160a060020a0316600160a060020a031663e5cb325632886000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100025760325a03f1156100025750506040515191909110159050610a5f5760009250610897565b60408051600254845460006020938401819052845160e060020a63d7c002b902815232600160a060020a03908116600483015261010090930483166024820152604481018790529451929091169363d7c002b993606482810194919391928390030190829087803b156100025760325a03f11561000257505060405151151590506109c55760009250610897565b604080516002548454600186015460006020948501819052855160e460020a630bd46bf9028152610100909304600160a060020a0390811660048501523281166024850152604484018c90526064840192909252945192169363bd46bf909360848084019491939192918390030190829087803b156100025760325a03f11561000257505060405151151590506107d85760009250610897565b60408051600254845460006020938401819052845160e060020a63d7c002b9028152610100909204600160a060020a0390811660048401523281166024840152604483018790529451929094169363d7c002b99360648381019491939192918390030190829087803b156100025760325a03f1156100025750506040515115159050610aee5760009250610897565b604080516002548454600186015460006020948501819052855160e460020a630bd46bf902815232600160a060020a03908116600483015261010090940484166024820152604481018c905260648101929092529451929091169363bd46bf909360848381019491939192918390030190829087803b156100025760325a03f11561000257505060405151151590506107d85760009250610897565b600094508493505b50505094509492505050565b600191909101906104e1565b5060019594505050505056",
    "events": {
      "0x9664b3e48dffdaa6b45a2bdf133d561baf5ad1816b0e4d3c3ad2137ced1029f1": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "OrderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnOperationPostedToTheMarket",
        "type": "event"
      },
      "0x040ded704618e8687af7cea7274b6d18b47c2243076daf089701eae75c9c3959": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "OrderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnExecuteOperationDirectInTheMarket",
        "type": "event"
      },
      "0x441861bc50ab19e6309dd123a12a22306055035ee297a07bf3c5171b3497b53b": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "orderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnOrderPostedToTheMarket",
        "type": "event"
      },
      "0x7074e8044ae07406d7ed08e6eb16e4d0ffff4d92db330c683fedf9d535119ebb": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "orderType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "assetId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "quantity",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "price",
            "type": "uint256"
          }
        ],
        "name": "OnExecuteOrderDirectInTheMarket",
        "type": "event"
      }
    },
    "updated_at": 1478650330109,
    "links": {}
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "WallStreetMarket";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.WallStreetMarket = Contract;
  }
})();
