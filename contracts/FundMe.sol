// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MINIMUM_USD = 50 * 1e18; // 1 * 10 ** 18

  address[] private sFunders;
  mapping(address => uint256) private sAddressToAmountFunded;
  AggregatorV3Interface private sPriceFeed;

  address private immutable iOwner;

  modifier onlyOwner() {
    // require(msg.sender == iOwner, "Sender is not owner!");
    if (msg.sender != iOwner) {
      revert FundMe__NotOwner();
    }
    _;
  }

  constructor(address priceFeedAddress) {
    iOwner = msg.sender;
    sPriceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  function fund() public payable {
    require(
      msg.value.getConversionRate(sPriceFeed) > MINIMUM_USD,
      "Did not send enough!"
    );
    sFunders.push(msg.sender);
    sAddressToAmountFunded[msg.sender] = msg.value;
  }

  function withdraw() public onlyOwner {
    address[] memory funders = sFunders; // memory: arr - yes, mappings - no
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      sAddressToAmountFunded[funder] = 0;
    }
    sFunders = new address[](0);

    (bool callSuccess, ) = iOwner.call{value: address(this).balance}("");
    require(callSuccess, "Call failed");
  }

  function getOwner() public view returns(address) {
    return iOwner;
  }

  function getFunder(uint256 funderIndex) public view returns(address) {
    return sFunders[funderIndex];
  }

  function getAddressToAmountFunded(address funder) public view returns(uint256) {
    return sAddressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns(AggregatorV3Interface) {
    return sPriceFeed;
  }
}



// function moreExpensiveWithdraw() public onlyOwner {
//   for (uint256 funderIndex = 0; funderIndex < sFunders.length; funderIndex++) {
//     address funder = sFunders[funderIndex];
//     sAddressToAmountFunded[funder] = 0;
//   }
//   sFunders = new address[](0);

//   (bool callSuccess, ) = payable(msg.sender).call{
//     value: address(this).balance
//   }("");
//   require(callSuccess, "Call failed");
// }
