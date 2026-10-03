# HarvestX

HarvestX is a blockchain-based incentivization platform that transforms organic waste management into a profitable, transparent, and environmentally sustainable operation. Farmers earn tokenized rewards (HX, symbol `HXT`) and tradable carbon credits for processing organic waste, creating a circular economy that benefits both the environment and local communities.

The repository is an MVP built for **Ethereum Sepolia**. It combines Solidity smart contracts managed with Foundry and a Next.js frontend using wagmi, viem, and RainbowKit. The deployed Sepolia version uses `MockUSDC` and `MockPriceOracle`; it is not a production carbon-credit registry or a real investment product.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
  - [Global Challenges](#global-challenges)
  - [Local Context (Kenya and Africa)](#local-context-kenya-and-africa)
- [Solution](#solution)
  - [Real-World Impact](#real-world-impact)
- [What HarvestX Does](#what-harvestx-does)
- [Protocol Flow](#protocol-flow)
- [Technology Stack](#technology-stack)
  - [Blockchain and Smart Contracts](#blockchain-and-smart-contracts)
  - [Frontend](#frontend)
  - [Smart Contracts](#smart-contracts)
  - [Development Tools](#development-tools)
- [Repository Layout](#repository-layout)
- [Smart Contract Architecture](#smart-contract-architecture)
  - [Core Contracts](#core-contracts)
  - [Key Functions](#key-functions)
  - [Token Economics](#token-economics)
  - [Data Structures](#data-structures)
  - [Redemption Requirements](#redemption-requirements)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Contract Addresses](#4-contract-addresses)
  - [5. Deploy Contracts](#5-deploy-contracts)
  - [6. Run the Development Server](#6-run-the-development-server)
- [Demo Farmer Wallets](#demo-farmer-wallets)
  - [Importing a wallet into MetaMask](#importing-a-wallet-into-metamask)
  - [What to try](#what-to-try)
  - [Troubleshooting](#troubleshooting)
  - [Regenerating the list](#regenerating-the-list)
- [Usage Guide](#usage-guide)
  - [For Farmers](#for-farmers)
  - [For Corporations](#for-corporations)
  - [For Admins](#for-admins)
- [Token and Redemption System](#token-and-redemption-system)
  - [Token Details](#token-details)
  - [Redemption Flow](#redemption-flow)
  - [Redemption Requirements](#redemption-requirements)
  - [Debugging Redemption Issues](#debugging-redemption-issues)
- [Carbon Credits Marketplace](#carbon-credits-marketplace)
  - [How It Works](#how-it-works)
  - [Pricing](#pricing)
- [Economic Model](#economic-model)
  - [Token Distribution](#token-distribution)
  - [Example Economics](#example-economics)
- [Frontend Routes](#frontend-routes)
- [Deployed Contracts](#deployed-contracts)
  - [Ethereum Sepolia](#ethereum-sepolia)
  - [Get Testnet Tokens](#get-testnet-tokens)
- [Testing and Verification](#testing-and-verification)
  - [Known Contract Gaps](#known-contract-gaps)
- [Troubleshooting](#troubleshooting)
  - [`transaction gas limit too high`](#transaction-gas-limit-too-high)
  - [Wrong contract address or failed faucet](#wrong-contract-address-or-failed-faucet)
  - [`Insufficient credits`](#insufficient-credits)
  - [`Insufficient USDC amount`](#insufficient-usdc-amount)
  - [`Insufficient USDC in contract`](#insufficient-usdc-in-contract)
  - [Redemption reverts for a verified farmer](#redemption-reverts-for-a-verified-farmer)
  - [WalletConnect project missing](#walletconnect-project-missing)
  - [Foundry dependency errors](#foundry-dependency-errors)
- [Demo](#demo)
- [Authors](#authors)

---

## Overview

HarvestX is a decentralised application built on Sepolia that incentivizes organic waste processing through blockchain technology. The platform creates a transparent, verifiable system where farmers earn cryptocurrency tokens and carbon credits for processing organic waste, while corporations can purchase these carbon credits to offset their emissions.

---

## Problem Statement

### Global Challenges

1. **Waste management crisis**: over 2 billion tons of organic waste generated annually, with 33% improperly managed.
2. **Environmental impact**: organic waste in landfills produces methane, which is 25x more potent than CO2.
3. **Lack of incentives**: farmers and waste processors have no economic motivation for proper waste management.
4. **Carbon credit opacity**: existing carbon credit systems are opaque, centralized, and inaccessible to small-scale farmers.
5. **Verification issues**: no transparent way to verify waste processing and CO2 savings.

### Local Context (Kenya and Africa)

- Limited waste management infrastructure.
- High agricultural waste (coffee husks, tea waste, crop residues).
- Need for additional farmer income streams.
- Growing corporate demand for carbon offsetting.

---

## Solution

HarvestX creates a **blockchain-verified, transparent waste-to-value ecosystem** where:

1. **Farmers register** on the platform and process organic waste.
2. **Smart contracts automatically mint** HX tokens based on waste processed (1 HX per 10 kg).
3. **Carbon credits are generated** based on CO2 saved (400 g CO2 per kg of waste).
4. **Corporations purchase** verified carbon credits directly from farmers.
5. **Farmers redeem** HX tokens for USDC stablecoin at a 1:1 ratio.
6. **All transactions** are recorded immutably on-chain for transparency.

### Real-World Impact

- **Environmental**: reduces methane emissions and landfill waste.
- **Economic**: creates new income streams for farmers with stablecoin payouts.
- **Social**: generates employment opportunities, with worker tracking included.
- **Transparency**: blockchain verification ensures authenticity.
- **Scalability**: can expand across multiple agricultural communities.

---

## What HarvestX Does

HarvestX connects four activities:

1. A farmer registers an address and records a waste collection.
2. The `HarvestX` contract updates environmental and worker statistics, calculates carbon savings, and mints HX reward tokens.
3. A buyer uses USDC to purchase the farmer's recorded carbon credits. The buyer pays the farmer directly, less the platform fee.
4. A verified farmer can redeem HX tokens for USDC when the protocol has sufficient USDC reserves.

The application provides these user flows:

- **Farmers**: register, process waste, claim product tokens, view impact, inspect history, and redeem rewards.
- **Carbon-credit buyers**: obtain test USDC, look up a farmer, calculate a price, approve USDC, and purchase credits.
- **Platform administrators**: verify farmers, change pricing and fee settings, update the oracle, and withdraw accumulated platform fees.

The current contract records carbon credits as on-chain accounting data. It does not issue a separate transferable carbon-credit NFT or register credits with an external carbon registry.

---

## Protocol Flow

```text
Farmer
  │
  ├─ register()
  ├─ processWaste(kg, type, workers, worker payment)
  │    ├─ updates farmer and global impact
  │    ├─ accrues carbon savings
  │    └─ mints HX rewards
  ├─ claimProductTokens(product kg)
  │    └─ mints HX for produced compost, fertilizer, or biochar
  └─ redeemHxForStablecoin(amount)
       └─ burns HX and receives mock USDC

Buyer
  │
  ├─ approve MockUSDC for HarvestX
  └─ buyCarbonCredits(farmer, tons, maximum USDC)
       ├─ reads the price from MockPriceOracle
       ├─ transfers USDC to HarvestX
       └─ pays the farmer after the platform fee
```

---

## Technology Stack

### Blockchain and Smart Contracts

- **Ethereum Sepolia**: Testnet deployment target, chain ID `11155111`
- **Solidity `^0.8.20`**: Smart contract development
- **OpenZeppelin Contracts 5.7.0**: `Ownable` access control and ERC-20 implementation
- **Foundry (Forge, Cast, Anvil)**: Build, test, gas reporting, formatting, and local node
- **Etherscan**: Source verification for the Sepolia deployment

### Frontend

- **Next.js 16.3.5**: React framework with App Router and Turbopack
- **React 19.2.8**
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **RainbowKit 2.2**: Wallet connection interface
- **Wagmi 2**: React hooks for Ethereum
- **Viem 2**: TypeScript Ethereum library

### Smart Contracts

- **`src/HarvestX.sol`**: Main contract for farming, carbon credits, and redemption
- **`src/HarvestXToken.sol`**: ERC-20 HX token, 18 decimals, symbol `HXT`
- **`test/mocks/MockUSDC.sol`**: Mock USDC stablecoin, 6 decimals, symbol `mUSDC`
- **`test/mocks/MockPriceOracle.sol`**: Development carbon-price oracle, defaults to $100 per ton

### Development Tools

- **Git / GitHub**: Version control
- **VS Code**: Development environment
- **ESLint 9**: Code quality

---

## Repository Layout

```text
.
├── src/                       Solidity contracts
│   ├── HarvestX.sol
│   └── HarvestXToken.sol
├── script/                    Foundry deployment and interaction scripts
├── test/
│   ├── mocks/                 MockUSDC and MockPriceOracle
│   ├── unit/                  HarvestX unit tests
│   └── intergration/          Deployment and end-to-end interaction tests
├── web/                       Next.js application
│   ├── app/                   Landing and dashboard routes
│   ├── components/            Shared UI and wallet components
│   └── lib/                   Wagmi configuration, contracts, and hooks
├── broadcast/                 Foundry deployment records
├── Makefile                   Common Foundry and Sepolia commands
└── foundry.toml               Foundry configuration
```

---

## Smart Contract Architecture

### Core Contracts

#### 1. `HarvestX.sol` - Main Platform Contract

```solidity
contract HarvestX is Ownable {
    // Key features:
    // - Farmer registration and verification
    // - Waste processing with HX token rewards
    // - Carbon credit generation and purchase
    // - MockUSDC redemption system
    // - Oracle and USDC address management
}
```

#### 2. `HarvestXToken.sol` - HX Token (ERC-20)

```solidity
contract HarvestXToken is ERC20, Ownable {
    // 18 decimals (standard), name "HxToken", symbol "HXT"
    // mint(address,uint256)     - onlyOwner
    // redeem(uint256)           - burns the caller's own balance
    // burnFrom(address,uint256) - onlyOwner, used by HarvestX redemption
}
```

#### 3. `MockUSDC.sol` - Mock USDC Stablecoin

```solidity
contract MockUSDC is ERC20, Ownable {
    // 6 decimals (USDC standard), name "Mock USDC", symbol "mUSDC"
    // quickFaucet()          - transfers 10,000 mUSDC to the caller
    // refillFaucet(uint256)  - onlyOwner, tops up faucet reserves
    // mint(address,uint256)  - onlyOwner
}
```

#### 4. `MockPriceOracle.sol` - Development Price Oracle

```solidity
contract MockPriceOracle {
    // carbonPricePerTon defaults to 100e8 ($100 per metric ton, 8 decimals)
    // getCarbonCreditPricePerTon() - implements IPriceOracle
    // setCarbonCreditPricePerTon(uint256)
}
```

### Key Functions

#### Farmer Functions

- `register()`: Register as a farmer on the platform.
- `processWaste(kg, wasteType, workers, payment)`: Submit a waste collection, accrue CO2 savings, and mint HX.
- `claimProductTokens(productKg)`: Claim HX for produced compost, fertilizer, or biochar.

#### Redemption Functions

- `redeemHxForStablecoin(hxAmount)`: Burn HX and receive MockUSDC at a 1:1 ratio. Restricted to verified farmers.
- `checkRedemptionStatus(hxAmount)`: Check redemption eligibility. View function.

#### View Functions

- `getImpact(address)`: Get a farmer's complete statistics.
- `getGlobalStats()`: Platform-wide metrics.
- `getAvailableCarbonCredits(address)`: Check the credits a farmer can still sell.
- `getWastehistory(address)`: Retrieve all waste collections. The contract spells this one `getWastehistory`, with a lowercase `h`.
- `getWorkerPayments(address)`: Retrieve recorded worker payments.
- `getCorporatePurchases(buyer)`: Total credits purchased by a buyer.

#### Carbon Credit Functions

- `buyCarbonCredits(farmer, tons, maxUSDC)`: Purchase a farmer's carbon credits.
- `calculatePriceInUSDC(tons)`: Quote the purchase price. View function.
- `getAvailableCarbonCredits(farmer)`: Check available credits.

#### Admin Functions

- `verifyFarmer(address)`: Verify a farmer for carbon-credit sales.
- `revokeVerification(address)`: Revoke farmer verification.
- `setPlatformFee(feePercentage)`: Set the platform fee, up to 10%.
- `setMinPricePerTon(price)`: Set the minimum carbon-credit price.
- `updateOracle(address)`: Replace the price oracle.
- `updateUSDC(address)`: Replace the MockUSDC address.
- `withdrawPlatformFees(amount)`: Withdraw accumulated platform fees.

All admin functions are `onlyOwner`.

### Token Economics

```text
HX token:      18 decimals, symbol HXT
MockUSDC:       6 decimals, symbol mUSDC
Waste reward:  1 HX per 10 kg of waste (TOKENS_PER_10KG = 1e18)
CO2_PER_KG:    400 g CO2e per kg, scaled as 400e18
Carbon credit: hundredths of a metric ton, so 100 means 1.00 ton
Default price: $100 per metric ton (100e8, 8 decimals)
Platform fee:  2% by default, 10% maximum
Redemption:    1 HX (1e18) redeems for 1 USDC (1e6); HX is burned
```

| Value | Contract representation |
| --- | --- |
| Waste and product quantities | Integer kilograms |
| Worker payment | Integer Kenyan shillars recorded as KES |
| Oracle price | USD with 8 decimals, e.g. `100e8` for $100 per ton |
| Carbon-credit amount | Hundredths of a metric ton, so `100` means `1.00` ton |

### Data Structures

```solidity
struct FarmerData {
    bool isRegistered;
    uint256 totalWasteKg;
    uint256 totalCO2Saved;
    uint256 totalProductKg;
    uint256 totalWorkersPaid;
    uint256 totalPayoutKES;
}

struct WasteCollection {
    uint256 kgCollected;
    uint256 timestamp;
    uint256 workersInvolved;
    uint256 workersPaymentKES;
    string wasteType;
}

struct WorkerPayment {
    address worker;      // may be zero when paid in cash
    uint256 amountKES;
    uint256 timestamp;
}
```

### Redemption Requirements

To redeem HX for MockUSDC, farmers must:

1. Be registered on the platform.
2. Be verified by the contract owner. `redeemHxForStablecoin` is `onlyVerifiedFarmer`.
3. Request an amount greater than zero.
4. Hold at least the equivalent HX balance.
5. Ensure the `HarvestX` contract holds sufficient MockUSDC reserves.

---

## Setup Instructions

### Prerequisites

```bash
# Node.js (v20.9.0 or higher)
node --version

# npm
npm --version

# Git
git --version

# Foundry (forge, cast, anvil)
forge --version
```

You also need:

- A browser wallet that can connect to Sepolia, such as MetaMask.
- Sepolia test ETH for transaction fees.
- A WalletConnect Cloud project ID for the frontend.

The contracts use Solidity `0.8.20` and OpenZeppelin Contracts 5.7.0. Foundry dependencies are Git submodules under `lib/`.

### 1. Clone the Repository

```bash
git clone https://github.com/keyanureeves/harvest_x.git
cd harvest_x
```

If the repository is already checked out, initialize its submodules:

```bash
git submodule update --init --recursive
```

### 2. Install Dependencies

Contract dependencies and build verification, from the repository root:

```bash
forge build
forge test
```

If dependencies need to be refreshed:

```bash
forge update
```

The frontend is a separate npm application:

```bash
cd web
npm ci
cd ..
```

### 3. Environment Configuration

For frontend development, create `web/.env.local` with the WalletConnect project ID used by RainbowKit:

```dotenv
NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect-project-id>
```

For contract deployment, create `.env` in the repository root:

```dotenv
# Deployment
SEPOLIA_RPC_URL=<your-sepolia-rpc-url>
PRIVATE_KEY=<test-wallet-private-key>
ETHERSCAN_API_KEY=<etherscan-api-key>

# Post-deployment configuration and funding targets
HARVESTX_SEPOLIA=<deployed-harvestx-address>
SEPOLIA_MOCK_USDC=<deployed-mock-usdc-address>
SEPOLIA_MOCK_ORACLE=<deployed-mock-oracle-address>
FUND_AMOUNT_USDC=<amount-in-six-decimal-units>
```

`FUND_AMOUNT_USDC` must be a raw MockUSDC amount with six decimals; for example, `1000000` represents one USDC. The root `.env` file is ignored by Git and must never be committed.

Use a dedicated testnet wallet. Never put a private key, RPC credential, or API secret in source code, frontend environment variables, or documentation.

### 4. Contract Addresses

Contract addresses are configured in [`web/lib/contracts/HarvestXAbi.ts`](web/lib/contracts/HarvestXAbi.ts). Update these after deployment:

```typescript
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
```

The matching ABIs live alongside it in `MockUsdcAbi.ts`, `MockPriceOracleAbi.ts`, and `HarvestXTokenAbi.ts`. The frontend is configured for Sepolia in [`web/lib/config.ts`](web/lib/config.ts) and currently uses the Tenderly Sepolia gateway; the RPC URL is defined in that file rather than read from an environment variable.

### 5. Deploy Contracts

The deployment script deploys `MockUSDC`, `MockPriceOracle`, `HarvestXToken`, and `HarvestX` in dependency order, wires their addresses into `HarvestX`, and transfers HX token ownership to `HarvestX` so the main contract can mint farmer rewards.

```bash
make deploy-sepolia
```

The command uses the private key to broadcast transactions and the Etherscan API key to verify the contracts. Record the addresses emitted by the script and the latest file under `broadcast/DeployHarvestX.s.sol/11155111/`.

To replace only the mock dependencies of an existing `HarvestX` deployment:

```bash
make deploy-mocks-sepolia
make configure-mocks-sepolia
```

Set `HARVESTX_SEPOLIA`, `SEPOLIA_MOCK_USDC`, and `SEPOLIA_MOCK_ORACLE` to the relevant addresses first. The wallet used by `configure-mocks-sepolia` must be the `HarvestX` owner, because the configuration functions are owner-only. The wallet used by `deploy-mocks-sepolia` becomes the owner of the newly deployed `MockUSDC`.

Redemption requires MockUSDC to be held by the `HarvestX` contract, so fund the reserves before testing:

```bash
make fund-harvestx-usdc-sepolia
```

The wallet used by this command must be the `MockUSDC` owner because the script calls `MockUSDC.mint`.

### 6. Run the Development Server

To start the local Anvil node defined by the Makefile:

```bash
make anvil
```

Then, from the repository root:

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. Connect a wallet and switch it to Sepolia when prompted.

The available frontend checks are:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

`npm start` serves an existing production build. Run `npm run build` first.

---

## Demo Farmer Wallets

Anyone connecting their own wallet can register and log waste, but redemption
requires `verifyFarmer`, which is `onlyOwner`. So the five wallets below were
pre-configured on Sepolia ahead of time. Import one and the farmer flow is
unlocked immediately, with no setup and nothing to fund.

Each wallet is already funded with 0.05 Sepolia ETH, registered, and verified.

> These private keys are published here on purpose, so anyone can try the demo
> without asking you for anything. That also means anyone can act as these
> farmers. Keep them on Sepolia, never send them anything of real value, and
> rotate them with `make demo-wallets && make onboard-testers-sepolia` if they
> get abused.

| Address | Private key | Label |
| --- | --- | --- |
| `0x76316019BAC3b1911BE490B99856E4899295E6C1` | `0xb3dadaa6f7c1206058b62ed11427697eb155db6619756af602cf8cae8d2b3190` | demo-farmer-1 |
| `0xDACE667c83A78771Ff4719b1E6d546f1f8493Af1` | `0x48fc8e5035cf8f14d3703d8ac0c02b3cf772d644d61fd3abacf2c3452473dfe5` | demo-farmer-2 |
| `0x94463f98796DB67A8Cb158B7908A9D11eC44335f` | `0xd4268f22a3c45a124efb9144f2bff2566237568592e100ba2fae86df639caa38` | demo-farmer-3 |
| `0x6f1D1519d8e962a3ABbB404F197c6C1607FaF874` | `0xe549b4f700e202600eafc94d97f2ced904abbe79e6e185bb1c3c4766f495a1e1` | demo-farmer-4 |
| `0x201981a964d0EBa2348Ff3faa381AA541634f917` | `0xce9bb5cb272eb2a05e2bc74e1e504bfd50f9c4f834ef08cc79713f3e46094267` | demo-farmer-5 |

Verify any of them yourself:

```bash
cast call 0x0bb5B927aED4FE97483b0bF72AD9999Fd9BB3195 'verifiedFarmers(address)(bool)' <address> \
  --rpc-url <your-sepolia-rpc-url>
```

### Importing a wallet into MetaMask

A website cannot add an account to MetaMask, so this step is always manual.

1. Open MetaMask, click the round account icon in the top-right corner.
2. Choose **Import account** under "My accounts". Do **not** choose "Connect" —
   Connect only links an account you already have.
3. Select **Private key** and paste the key from the table above. It starts with
   `0x` and is 66 characters. No extra spaces or quotes.
4. Choose a MetaMask password, which encrypts the key locally on your machine.
5. Click **Import**.

Then switch MetaMask to Sepolia, or transactions will fail:

1. Click the network name at the top of the popup.
2. If **Sepolia** is listed, select it. Otherwise click **Show test networks**.
3. If there is no toggle, use **Add network** → **Add network manually**:

   | Field | Value |
   | --- | --- |
   | Network name | `Sepolia` |
   | RPC URL | `https://ethereum-sepolia-rpc.publicnode.com` |
   | Chain ID | `11155111` |
   | Currency symbol | `ETH` |
   | Block explorer | `https://sepolia.etherscan.io` |

Finally open the app, click **Connect wallet**, choose **MetaMask**, and confirm
the account shown matches the address you imported.

### What to try

1. **Dashboard** — confirm the farmer shows as registered and verified.
2. **Process waste** — log a collection. Minimum 10 kg. Try 50 kg of coffee
   husks, 3 workers, 5000 KES paid. You receive HX tokens and carbon credits at
   1 HX per 10 kg and 400 g CO2 avoided per kg.
3. **Carbon credits** — look up the farmer address to see available credits and
   their estimated USDC value.
4. **Buy credits** — the buyer flow needs mock USDC, which the token hands out
   itself via `quickFaucet`. Approve HarvestX, then buy.
5. **Balance** — redeem HX for USDC 1:1. Tokens are burned on redemption.

### Troubleshooting

**"Wrong network", or a transaction fails instantly.** MetaMask is not on
Sepolia. Redo the network step.

**"Farmer not verified" or "Not registered".** The wrong account is connected.
Compare the address in MetaMask against the table.

**"Insufficient funds for gas".** The 0.05 ETH is spent. Use a different wallet
from the table rather than topping up from a public faucet.

**"Insufficient USDC in contract" when redeeming.** The contract's USDC reserve
is shared by everyone and can be drained by `buyCarbonCredits`. Refill it with
`make fund-harvestx-usdc-sepolia`.

### Regenerating the list

```bash
make demo-wallets COUNT=5 LABEL=demo-farmer   # new keys, new addresses
make onboard-testers-sepolia                 # fund + register + verify them
cat demo-testers.csv                         # replace the table above
```

Keys land in `demo-testers.keys.csv`, which is gitignored. Both make targets
abort if that file is ever tracked by git, and `OnboardTesters` refuses to
onboard the contract owner, since that key controls `verifyFarmer`,
`withdrawPlatformFees` and `renounceOwnership`.

---

## Usage Guide

### For Farmers

#### 1. Connect Wallet

- Click **Connect Wallet** in the sidebar.
- Select a browser wallet or WalletConnect.
- Ensure you are on Ethereum Sepolia.

#### 2. Register

- Navigate to **Dashboard**.
- Click **Register as Farmer**.
- Confirm the transaction in your wallet.
- Wait for confirmation.

#### 3. Process Waste

- Go to the **Process Waste** page.
- Fill in the details:
  - Amount of waste, minimum 10 kg.
  - Waste type.
  - Number of workers involved, at least 1.
  - Total payment to workers in KES, greater than zero.
- Submit and confirm the transaction.
- Receive HX tokens automatically, plus accruing CO2 savings.

#### 4. Claim Product Tokens

- After composting, go to **Mint Tokens**.
- Enter the kg of compost, fertilizer, or biochar produced.
- Submit the transaction.
- Receive additional HX tokens.

#### 5. Redeem HX for USDC

- Navigate to the **Balance** page.
- Ensure you have been verified by the owner from the **Admin** page.
- Enter the HX amount to redeem, for example 100 HX.
- Click **Redeem for USDC** and confirm the transaction.
- Receive MockUSDC at a 1:1 ratio, less network fees.

#### 6. View Carbon Credits

- Navigate to the **Carbon Credits** page.
- View the credits available for sale.
- Share your wallet address with corporations.

### For Corporations

#### 1. Get Test USDC

- Navigate to the **Balance** page.
- Use the MockUSDC faucet to get test tokens. `quickFaucet` sends 10,000 mUSDC per call. Although the mock declares `hasUsedFaucet`, it never records a claim, so the faucet can be called repeatedly while the mock has funds.

#### 2. Purchase Carbon Credits

- Navigate to the **Carbon Credits** page.
- Switch to the **Corporate Buyer** view.
- Enter the farmer's wallet address and the tons of CO2 to purchase.
- The UI sends tons as hundredths of a ton, so `1.5` becomes `150` on-chain.
- Approve MockUSDC when prompted; the purchase hook waits for approval to confirm before submitting.
- Submit and confirm the transaction. MockUSDC is transferred to `HarvestX`, the platform fee remains in the contract, and the farmer receives the remainder.

### For Admins

#### 1. Verify Farmers

- Navigate to the **Admin** page, which is owner-only.
- Check the farmer registration status.
- Enter the farmer address to verify. The farmer can then redeem HX and, once enforcement is restored, sell carbon credits.
- Use **revoke verification** to remove verification.

#### 2. Configure Pricing and Fees

- Set the minimum carbon-credit price per ton.
- Set the platform fee, up to 10%.
- Replace the price oracle or the MockUSDC address.

#### 3. Fund the Contract for Redemptions

- Ensure the contract holds sufficient MockUSDC for redemptions.
- Transfer MockUSDC to the contract address, or use `make fund-harvestx-usdc-sepolia`.

#### 4. Withdraw Platform Fees

- Withdraw the accumulated platform USDC from the contract.

---

## Token and Redemption System

### Token Details

| Token | Symbol | Decimals | Purpose |
| --- | --- | --- | --- |
| HxToken | `HXT` | 18 | Utility token earned from waste processing and product claims |
| Mock USDC | `mUSDC` | 6 | Stablecoin for redemptions and carbon-credit purchases |

### Redemption Flow

```text
┌────────────────────────────────────────────────────────────────┐
│                       REDEMPTION PROCESS                       │
├────────────────────────────────────────────────────────────────┤
│         1. Farmer calls redeemHxForStablecoin(100 HX)          │
│                     2. Contract verifies:                      │
│                      - farmer is registered                    │
│             - farmer is verified (onlyVerifiedFarmer)          │
│                   - amount is greater than zero                │
│                   - farmer holds 100 HX (1e18)                 │
│                 - contract holds 100 mUSDC (1e6)               │
│             3. Contract burns 100 HX via burnFrom              │
│         4. Contract transfers 100 mUSDC to the farmer          │
│                   5. Redeemed event emitted                    │
└────────────────────────────────────────────────────────────────┘
```

### Redemption Requirements

| Requirement | Description |
| --- | --- |
| Registration | Farmer must be registered via `register()` |
| Verification | Farmer must be verified by the owner; the function is `onlyVerifiedFarmer` |
| Amount | Redemption amount must be greater than zero |
| HX balance | Farmer must hold at least the requested HX |
| USDC reserve | The `HarvestX` contract must hold sufficient MockUSDC |

### Debugging Redemption Issues

Use the `checkRedemptionStatus(amount)` view function to diagnose issues. It returns:

- `canRedeem`: whether the redemption would succeed.
- `reason`: the failure reason when it would not.
- `usdcAmount`: the MockUSDC that would be sent.
- `contractUSDCBalance`: the contract's current reserves.
- `userHXBalance`: the caller's HX balance.
- `isRegistered`: whether the caller is registered.
- `isVerified`: whether the caller is verified.

---

## Carbon Credits Marketplace

### How It Works

1. **Generation**: Farmers earn carbon credits by processing waste.
   - 1 kg of waste equals 400 g of CO2 saved, scaled as `400e18`.
   - Credits accumulate in the farmer's account as `carbonCreditsEarned`.
2. **Verification**: The owner verifies legitimate farmers.
   - Only registered farmers can currently sell credits. `buyCarbonCredits` checks `farmers[farmer].isRegistered` but does not yet require `verifiedFarmers[farmer]`; review this before relying on verification for credit sales.
3. **Trading**: Corporations purchase credits directly.
   - The price is read from `MockPriceOracle`.
   - Settlement is instant and on-chain.
   - Payment goes directly to the farmer, less the platform fee.
4. **Transparency**: All transactions are on-chain.
   - Immutable record.
   - Easy auditing.
   - Real impact verification.

### Pricing

- **Oracle rate**: $100 per metric ton by default, in 8 decimals (`100e8`).
- **Minimum price**: configurable by the owner through `setMinPricePerTon`, and enforced against the oracle price.
- **Platform fee**: 2% by default, 10% maximum.
- **Payment**: MockUSDC stablecoin.
- **Precision**: carbon-credit amounts are stored in hundredths of a metric ton, so `100` means `1.00` ton.

---

## Economic Model

### Token Distribution

```text
Waste processing: 1 HX per 10 kg
Product creation: 1 HX per 10 kg compost/fertilizer/biochar
Total supply:     Unlimited (minted as rewards)
Redemption:       1 HX (1e18) = 1 USDC (1e6), after decimal adjustment
```

### Example Economics

**Small Farmer (Monthly)**

```text
Waste processed:   200 kg
Tokens earned:     20 HX
Redemption value:  20 USDC
CO2 credits:       0.08 tons (8 USDC at the default oracle price)
```

**Medium Cooperative (Monthly)**

```text
Waste processed:   2,000 kg (10 farmers)
Tokens earned:     200 HX
Redemption value:  200 USDC
CO2 credits:       0.8 tons (80 USDC at the default oracle price)
```

---

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | HarvestX landing page and product overview |
| `/dashboard` | Farmer registration and impact summary |
| `/process` | Waste processing form and carbon/reward preview |
| `/mint` | Product-token claims |
| `/carbon-credits` | Farmer credit view and corporate buyer flow |
| `/balance` | HX and MockUSDC balances, faucet, redemption, and activity |
| `/history` | Waste, product, and redemption event history |
| `/profile` | Connected-wallet profile information |
| `/admin` | Owner-only verification and configuration controls |

These routes are defined in the `web/app/(dashboard)` route group, so the group name does not appear in the URL.

---

## Deployed Contracts

### Ethereum Sepolia

| Contract | Address |
| --- | --- |
| `HarvestX` | `0x0bb5B927aED4FE97483b0bF72AD9999Fd9BB3195` |
| `HarvestXToken` | `0x377175AFb7E98c3302E4d47D570AfED6374AD658` |
| `MockUSDC` | `0x59Ca3C55C723674cD7Be54cEE7CcD735168bafd1` |
| `MockPriceOracle` | `0x6257Fcf9BBD032168E39aF1349f1EE3598229EB7` |
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| Explorer | https://sepolia.etherscan.io/ |

The authoritative deployment record is [`broadcast/DeployHarvestX.s.sol/11155111/run-latest.json`](broadcast/DeployHarvestX.s.sol/11155111/run-latest.json). When deploying a new stack, update the address constants in `HarvestXAbi.ts`, `MockUsdcAbi.ts`, `MockPriceOracleAbi.ts`, and `HarvestXTokenAbi.ts` so all frontend calls target the same deployment.

### Get Testnet Tokens

- **Sepolia ETH**: required for gas. Use a public Sepolia faucet.
- **Mock USDC**: use the in-app faucet on the **Balance** page, or fund the contract with `make fund-harvestx-usdc-sepolia`.

---

## Testing and Verification

The contract suite covers registration, validation, reward minting, carbon-credit accounting, buying, redemption, owner controls, and cross-contract deployment flows.

Useful commands are:

```bash
forge test
forge test --gas-report
cd web && npm run lint
cd web && npx tsc --noEmit
cd web && npm run build
```

The local verification used for this project passed:

- `forge test --match-test testBuyCarbonCreditsTransfersToFarmer --gas-report`
- `forge test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

The focused `buyCarbonCredits` report measured approximately 180,338 gas. A frontend gas estimate should be used instead of sending a fixed 21,000,000 gas limit; the current purchase hook adds a buffer and rejects limits above the Sepolia RPC cap of 16,777,216.

### Known Contract Gaps

Two access rules are not enforced on-chain and must be restored before production use:

1. `processWaste` has its registration check commented out, so any address can submit a waste record. The frontend enforces registration and verification, but the contract does not.
2. `buyCarbonCredits` requires that the farmer is registered, but not that the farmer is verified.

---

## Troubleshooting

### `transaction gas limit too high`

This usually means the wallet or RPC is trying to send a fixed gas limit above the provider cap, not that the contract actually requires that much gas. Keep the transaction gas limit close to the current estimate, use a Sepolia RPC that supports the request, and do not manually set 21,000,000 gas.

### Wrong contract address or failed faucet

Check that the wallet is on chain ID `11155111` and that the addresses in the frontend ABI files match the current deployment table. In particular, `MockUSDC` must point to the USDC address and not the oracle address.

### `Insufficient credits`

The farmer must have processed enough waste to create the requested carbon amount. The UI reports available credits in decimal tons, while the contract stores hundredths of a ton.

### `Insufficient USDC amount`

The buyer must provide at least the price returned by `calculatePriceInUSDC`. The buyer also needs enough MockUSDC and an allowance for the `HarvestX` contract.

### `Insufficient USDC in contract`

Fund the `HarvestX` contract with MockUSDC before testing redemption. Use `make fund-harvestx-usdc-sepolia` or transfer test USDC from the MockUSDC owner.

### Redemption reverts for a verified farmer

Call `checkRedemptionStatus(amount)` and read the `reason` field. Note that the insufficient-balance branch in `checkRedemptionStatus` currently returns the message `Insufficient USDC in contract` even when the real problem is an insufficient HX balance, so the reason string is not always reliable.

### WalletConnect project missing

Set `NEXT_PUBLIC_WC_PROJECT_ID` in `web/.env.local`, restart the Next.js server, and reload the browser.

### Foundry dependency errors

Initialize the Git submodules again:

```bash
git submodule update --init --recursive
forge build
```

---

## Demo

There is no public demo deployment yet. Run the project locally and open [http://localhost:3000](http://localhost:3000) against the Sepolia deployment listed above.

---

## Authors

HarvestX is developed and maintained by:

- Osbon Keya
- Stephen Mburu
