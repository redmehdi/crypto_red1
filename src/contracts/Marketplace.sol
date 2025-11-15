// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Marketplace {
    struct Listing {
        uint256 id;
        address seller;
        string itemName;
        uint256 price;
        bool active;
    }

    IERC20 public token;
    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address indexed seller, string itemName, uint256 price);
    event Purchased(uint256 indexed id, address indexed buyer, address indexed seller, uint256 price);
    event Cancelled(uint256 indexed id, address indexed seller);

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    function createListing(string calldata itemName, uint256 price) external {
        require(price > 0, "Price must be > 0");
        require(bytes(itemName).length > 0, "Item name required");

        Listing memory listing = Listing({
            id: nextListingId,
            seller: msg.sender,
            itemName: itemName,
            price: price,
            active: true
        });

        listings[nextListingId] = listing;
        emit Listed(nextListingId, msg.sender, itemName, price);
        nextListingId++;
    }

    function buy(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller != address(0), "Invalid listing");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        listing.active = false;

        bool ok = token.transferFrom(msg.sender, listing.seller, listing.price);
        require(ok, "Token transfer failed");

        emit Purchased(listingId, msg.sender, listing.seller, listing.price);
    }

    function cancel(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Already inactive");
        require(listing.seller == msg.sender, "Not your listing");

        listing.active = false;
        emit Cancelled(listingId, msg.sender);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getAllActive() external view returns (Listing[] memory) {
        uint256 total = nextListingId;
        uint256 count;

        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active) count++;
        }

        Listing[] memory result = new Listing[](count);
        uint256 idx;

        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active) {
                result[idx] = listings[i];
                idx++;
            }
        }

        return result;
    }
}
