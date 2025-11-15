import React, { Component } from 'react';
import Web3 from 'web3';
import MyToken from '../abis/MyToken.json';
import Marketplace from '../abis/Marketplace.json';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

class App extends Component {
  state = {
    account: '',
    token: null,
    marketplace: null,
    tokenBalance: '0',
    listings: [],
    loading: true,
    newItemName: '',
    newItemPrice: ''
  };

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if (window.web3) {
      this.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Please install MetaMask to use this DApp');
    }
  }

  async loadBlockchainData() {
    if (!this.web3) {
      this.setState({ loading: false });
      return;
    }
    const web3 = this.web3;
    const accounts = await web3.eth.getAccounts();
    const networkId = await web3.eth.net.getId();

    this.setState({ account: accounts[0] || '' });

    const tokenData = MyToken.networks[networkId];
    if (!tokenData) {
      window.alert('MyToken not deployed to detected network');
      this.setState({ loading: false });
      return;
    }
    const token = new web3.eth.Contract(MyToken.abi, tokenData.address);
    const rawBalance = await token.methods.balanceOf(accounts[0]).call();
    const tokenBalance = web3.utils.fromWei(rawBalance, 'ether');

    const marketplaceData = Marketplace.networks[networkId];
    if (!marketplaceData) {
      window.alert('Marketplace not deployed to detected network');
      this.setState({ loading: false });
      return;
    }
    const marketplace = new web3.eth.Contract(Marketplace.abi, marketplaceData.address);
    const listings = await marketplace.methods.getAllActive().call();

    this.setState({
      token,
      marketplace,
      tokenBalance,
      listings,
      loading: false
    });
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  createListing = async (event) => {
    event.preventDefault();
    const { marketplace, account, newItemName, newItemPrice } = this.state;
    if (!marketplace || !newItemName || !newItemPrice) {
      return;
    }

    this.setState({ loading: true });

    try {
      const priceWei = this.web3.utils.toWei(newItemPrice.toString(), 'ether');
      await marketplace.methods.createListing(newItemName, priceWei).send({ from: account });
      const listings = await marketplace.methods.getAllActive().call();
      this.setState({ listings, newItemName: '', newItemPrice: '' });
    } catch (error) {
      console.error(error);
      window.alert('Error creating listing');
    }

    this.setState({ loading: false });
  };

  buyListing = async (listing) => {
    const { token, marketplace, account } = this.state;
    if (!token || !marketplace) {
      return;
    }

    this.setState({ loading: true });

    try {
      await token.methods.approve(marketplace.options.address, listing.price).send({ from: account });
      await marketplace.methods.buy(listing.id).send({ from: account });

      const rawBalance = await token.methods.balanceOf(account).call();
      const tokenBalance = this.web3.utils.fromWei(rawBalance, 'ether');
      const listings = await marketplace.methods.getAllActive().call();
      this.setState({ tokenBalance, listings });
    } catch (error) {
      console.error(error);
      window.alert('Error buying listing');
    }

    this.setState({ loading: false });
  };

  renderListingRow(listing) {
    const { account } = this.state;
    const seller = `${listing.seller.substring(0, 6)}...${listing.seller.substring(listing.seller.length - 4)}`;
    const price = this.web3.utils.fromWei(listing.price.toString(), 'ether');
    const isSeller = listing.seller.toLowerCase() === account.toLowerCase();

    return (
      <tr key={listing.id}>
        <td>{listing.id}</td>
        <td>{listing.itemName}</td>
        <td>{seller}</td>
        <td>{price}</td>
        <td>
          {isSeller ? (
            <span className="text-muted">Your listing</span>
          ) : (
            <button className="btn btn-sm btn-success" onClick={() => this.buyListing(listing)}>
              Buy
            </button>
          )}
        </td>
      </tr>
    );
  }

  render() {
    const { account, tokenBalance, listings, loading, newItemName, newItemPrice } = this.state;

    return (
      <div className="container py-4">
        <nav className="navbar navbar-light bg-light mb-4">
          <span className="navbar-brand mb-0 h1">Red1 Token Marketplace</span>
          <div className="text-right">
            <div>
              <strong>Account:</strong> {account}
            </div>
            <div>
              <strong>R1T Balance:</strong> {tokenBalance}
            </div>
          </div>
        </nav>

        {loading && <div>Loading...</div>}

        {!loading && (
          <div className="row">
            <div className="col-md-4">
              <h4>Create Listing</h4>
              <form onSubmit={this.createListing}>
                <div className="form-group">
                  <label>Item name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="newItemName"
                    value={newItemName}
                    onChange={this.handleChange}
                    placeholder="Cool NFT"
                  />
                </div>
                <div className="form-group mt-3">
                  <label>Price (R1T)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    name="newItemPrice"
                    value={newItemPrice}
                    onChange={this.handleChange}
                    placeholder="1"
                  />
                </div>
                <button type="submit" className="btn btn-primary mt-3">
                  Create
                </button>
              </form>
            </div>

            <div className="col-md-8">
              <h4>Active Listings</h4>
              {listings.length === 0 && <p>No active listings.</p>}
              {listings.length > 0 && (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Seller</th>
                      <th>Price (R1T)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>{listings.map((listing) => this.renderListingRow(listing))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
