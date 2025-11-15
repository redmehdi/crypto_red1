const MyToken = artifacts.require("MyToken");

module.exports = async function (deployer) {
  const initialSupply = web3.utils.toWei("1000000", "ether");
  await deployer.deploy(MyToken, initialSupply);
};
