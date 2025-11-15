const path = require('path');
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: path.resolve(__dirname, 'node_modules/solc/soljson.js'),
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
