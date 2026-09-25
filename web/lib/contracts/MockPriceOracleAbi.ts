// Deployment address & ABI for MockPriceOracle (Sepolia).
// Address from broadcast/DeployHavestX.s.sol/11155111/run-latest.json.

export const MOCK_ORACLE_ADDRESS = "0x6257Fcf9BBD032168E39aF1349f1EE3598229EB7";

export const MOCK_PRICE_ORACLE_ABI = [
  {
    type: "function",
    name: "carbonPricePerTon",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCarbonCreditPricePerTon",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setCarbonCreditPricePerTon",
    inputs: [
      {
        name: "_price",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      {
        name: "newPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;
