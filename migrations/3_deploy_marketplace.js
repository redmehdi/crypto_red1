const MyToken = artifacts.require("MyToken");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function (deployer) {
  const token = await MyToken.deployed();
  await deployer.deploy(Marketplace, token.address);
};
