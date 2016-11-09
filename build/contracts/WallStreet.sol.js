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
      throw new Error("WallStreet error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("WallStreet error: contract binary not set. Can't deploy new instance.");
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

      throw new Error("WallStreet contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of WallStreet: " + unlinked_libraries);
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
      throw new Error("Invalid address passed to WallStreet.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: WallStreet not deployed or address not set.");
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
        "name": "buyAsset",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          },
          {
            "name": "id",
            "type": "bytes32"
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
          }
        ],
        "name": "operationIds",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
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
        "name": "sellAsset",
        "outputs": [
          {
            "name": "successful",
            "type": "bool"
          },
          {
            "name": "id",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [
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
          },
          {
            "indexed": false,
            "name": "id",
            "type": "bytes32"
          }
        ],
        "name": "LogBuyAsset",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
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
          },
          {
            "indexed": false,
            "name": "id",
            "type": "bytes32"
          }
        ],
        "name": "LogSellAsset",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x606060405260405160208061056e8339506080604052516000805433600160a060020a03199182161782556003805490911690921790915561052890819061004690396000f3606060405236156100565760e060020a60003504632b7358be811461005b57806368dadec214610072578063748eef3b1461011a5780637faef328146101315780638da5cb5b14610173578063d12f86631461018a575b610002565b3461000257610233600354600160a060020a031681565b34610002576102506004356024356044356000600060006000858502915081600360009054906101000a9004600160a060020a0316600160a060020a031663f8b2cb4f336000604051602001526040518260e060020a0281526004018082600160a060020a03168152602001915050602060405180830381600087803b156100025760325a03f115610002575050604051519190911015905061027d575b5050935093915050565b3461000257610233600454600160a060020a031681565b346100025761026b60043560028054829081101561000257506000527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace015481565b3461000257610233600054600160a060020a031681565b34610002576102506004356024356044356000600060006000858502915081600360009054906101000a9004600160a060020a0316600160a060020a031663f8b2cb4f326000604051602001526040518260e060020a0281526004018082600160a060020a03168152602001915050602060405180830381600087803b156100025760325a03f11561000257505060405151919091101590506103da5760009350839250610110565b60408051600160a060020a03929092168252519081900360200190f35b60408051921515835260208301919091528051918290030190f35b60408051918252519081900360200190f35b506040805133600160a060020a039081166c0100000000000000000000000081028352426014840152835192839003603401832060a084018552600080855260208581018d81528688018d8152606088018d81526080890186815286865260018086528b87209a518b5460ff1916178b559351938a0193909355905160028901555160038881019190915590516004978801555487518201839052875160e160020a63571a12c10281529687019490945232851660248701526044860188905295519195929093169363ae3425829360648281019493928390030190829087803b156100025760325a03f1156100025750505060405180519060200150507fceb8201147df712b071fb39ddbf680e547548ceaa328069c423568541873504f87878784604051808581526020018481526020018381526020018260001916815260200194505050505060405180910390a160018193509350610110565b506040805133600160a060020a039081166c0100000000000000000000000081028352426014840152835160349381900393909301832060a084018552600180855260208581018d81528688018d8152606088018d81526080890186815260008781528686528b81209a518b5460ff1916178b559351958a019590955590516002890155516003888101919091559251600497880155915487518201839052875160e160020a63571a12c10281523287169781019790975260248701949094526044860188905295519195929093169363ae3425829360648281019493928390030190829087803b156100025760325a03f11561000257505060408051898152602081018990528082018890526060810184905290517fe9410d401b43882b2e59b1e874cc452fd2319de3c5b1da822ed21ac13fccd84592509081900360800190a16001819350935061011056",
    "events": {
      "0xdea44b72211c4402d519026bf41e3116a8367de13ec87533ad4dcf923c900cf6": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "assetType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "name",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "symbol",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "LogAssetAdded",
        "type": "event"
      },
      "0xe4ae98c3024d4f07a535618a42b26f9baac1b748d055a9e5e50823f4d20e826e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "LogAssetRemoved",
        "type": "event"
      },
      "0xceb8201147df712b071fb39ddbf680e547548ceaa328069c423568541873504f": {
        "anonymous": false,
        "inputs": [
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
          },
          {
            "indexed": false,
            "name": "id",
            "type": "bytes32"
          }
        ],
        "name": "LogBuyAsset",
        "type": "event"
      },
      "0xe9410d401b43882b2e59b1e874cc452fd2319de3c5b1da822ed21ac13fccd845": {
        "anonymous": false,
        "inputs": [
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
          },
          {
            "indexed": false,
            "name": "id",
            "type": "bytes32"
          }
        ],
        "name": "LogSellAsset",
        "type": "event"
      }
    },
    "updated_at": 1478650330089,
    "links": {},
    "address": "0xa1577cf60b224163d034684d595bc736d4e1ffe1"
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

  Contract.contract_name   = Contract.prototype.contract_name   = "WallStreet";
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
    window.WallStreet = Contract;
  }
})();
