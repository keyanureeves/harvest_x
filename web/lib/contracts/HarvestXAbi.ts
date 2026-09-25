// Deployment addresses & ABI for HarvestX (Sepolia).
// Addresses come from the latest deployment in broadcast/DeployHavestX.s.sol/11155111/run-latest.json.

export const contractAddresses = {
  sepolia: {
    main: "0x0bb5B927aED4FE97483b0bF72AD9999Fd9BB3195",
    mockUSDC: "0x59Ca3C55C723674cD7Be54cEE7CcD735168bafd1",
    mockOracle: "0x6257Fcf9BBD032168E39aF1349f1EE3598229EB7",
    harvestXToken: "0x377175AFb7E98c3302E4d47D570AfED6374AD658",
  },
} as const;

export type ContractType = keyof typeof contractAddresses.sepolia;

export const getContractAddress = (
  chainId?: number,
  contractType: ContractType = "main",
): `0x${string}` => {
  // Default to Sepolia (11155111); falls back to Sepolia for any other chain.
  return contractAddresses.sepolia[contractType];
};

// For backwards compatibility
export const contractAddress = contractAddresses.sepolia.main;

export const HARVEST_X_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_hxTokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_priceOracleAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_usdc",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "CO2_GRAMS_PER_TON",
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
    name: "CO2_PER_KG",
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
    name: "GRAMS_PER_TON",
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
    name: "TOKENS_PER_10KG",
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
    name: "buyCarbonCredits",
    inputs: [
      {
        name: "_farmer",
        type: "address",
        internalType: "address",
      },
      {
        name: "_tonsCO2",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_amountUSDC",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "calculatePriceInUSDC",
    inputs: [
      {
        name: "_tonsCO2",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "priceUSD",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "priceUSDC",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "carbonCreditsClaimed",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "carbonCreditsEarned",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "checkRedemptionStatus",
    inputs: [
      {
        name: "hxAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "canRedeem",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
      {
        name: "usdcAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "contractUSDCBalance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "userHXBalance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isRegistered",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "isVerified",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimProductTokens",
    inputs: [
      {
        name: "_productKg",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "corporateCreditsPurchased",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "farmers",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "isRegistered",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "totalWasteKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalCO2Saved",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalProductKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalWorkersPaid",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalPayoutKES",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAvailableCarbonCredits",
    inputs: [
      {
        name: "_farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "available",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalEarned",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sold",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "estimatedValueUSDC",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCorporatePurchases",
    inputs: [
      {
        name: "_buyer",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "getGlobalStats",
    inputs: [],
    outputs: [
      {
        name: "farmersCount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "wasteKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "co2SavedKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensCirculating",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "carbonCreditsSolTons",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "platformFeesHX",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getImpact",
    inputs: [
      {
        name: "farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "wasteKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "productKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "co2Grams",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "co2Kg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokens",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "workersPaid",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalPayoutKES",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWastehistory",
    inputs: [
      {
        name: "farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct HarvestX.WasteCollection[]",
        components: [
          {
            name: "kgCollected",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "workersInvolved",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "workersPaymentKES",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "wasteType",
            type: "string",
            internalType: "string",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWorkerPayments",
    inputs: [
      {
        name: "farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct HarvestX.WorkerPayment[]",
        components: [
          {
            name: "worker",
            type: "address",
            internalType: "address",
          },
          {
            name: "amountKES",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "timestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "globalCO2Saved",
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
    name: "globalWasteKg",
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
    name: "hxToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract HarvestXToken",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "priceOracle",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IPriceOracle",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "processWaste",
    inputs: [
      {
        name: "collectedWasteKg",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_wasteType",
        type: "string",
        internalType: "string",
      },
      {
        name: "_workersInvolved",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_workersPaymentKES",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemHxForStablecoin",
    inputs: [
      {
        name: "_hxAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "register",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeVerification",
    inputs: [
      {
        name: "_farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMinPricePerTon",
    inputs: [
      {
        name: "_minPrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPlatformFee",
    inputs: [
      {
        name: "_feePercentage",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalCarbonCreditsSold",
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
    name: "totalFarmers",
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
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateOracle",
    inputs: [
      {
        name: "_newOracle",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateUSDC",
    inputs: [
      {
        name: "_newUSDC",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifiedFarmers",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyFarmer",
    inputs: [
      {
        name: "_farmer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "wasteHistory",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "kgCollected",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "workersInvolved",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "workersPaymentKES",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "wasteType",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawPlatformFees",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "workerPayments",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "worker",
        type: "address",
        internalType: "address",
      },
      {
        name: "amountKES",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CarbonCreditIssued",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "co2Grams",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CarbonCreditSold",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "buyer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tonsCO2",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "priceUSD",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "priceUSDC",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FarmerRegistered",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FarmerVerified",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InsufficientReserves",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "requestedTokens",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "mintableSupply",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MinPriceUpdated",
    inputs: [
      {
        name: "newPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OracleUpdated",
    inputs: [
      {
        name: "newOracle",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformFeeUpdated",
    inputs: [
      {
        name: "newFee",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformFeesWithdrawn",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProductClaimed",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "productKg",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "tokensminted",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Redeemed",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "owgAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "usdcAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "USDCUpdated",
    inputs: [
      {
        name: "newUSDC",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WasteProcessed",
    inputs: [
      {
        name: "farmer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "kg",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "tokensMinted",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "CO2Saved",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "wworkersInvolved",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "workerPayment",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
] as const;
