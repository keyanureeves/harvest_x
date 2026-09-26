# HarvestX

HarvestX is a waste-to-value blockchain application for recording organic-waste processing, rewarding farmers with an ERC-20 token, tracking carbon-credit impact, and settling testnet payments with USDC.

The repository is an MVP built for **Ethereum Sepolia**. It combines Solidity smart contracts managed with Foundry and a Next.js frontend using wagmi, viem, and RainbowKit. The deployed Sepolia version uses `MockUSDC` and `MockPriceOracle`; it is not a production carbon-credit registry or a real investment product.

## What HarvestX does

HarvestX connects four activities:

1. A farmer registers an address and records a waste collection.
2. The `HarvestX` contract updates environmental and worker statistics, calculates carbon savings, and mints HX reward tokens.
3. A buyer uses USDC to purchase the farmer's recorded carbon credits. The buyer pays the farmer directly, less the platform fee.
4. A verified farmer can redeem HX tokens for USDC when the protocol has sufficient USDC reserves.

The application provides these user flows:

- **Farmers:** register, process waste, claim product tokens, view impact, inspect history, and redeem rewards.
- **Carbon-credit buyers:** obtain test USDC, look up a farmer, calculate a price, approve USDC, and purchase credits.
- **Platform administrators:** verify farmers, change pricing and fee settings, update the oracle, and withdraw accumulated platform fees.

The current contract records carbon credits as on-chain accounting data. It does not issue a separate transferable carbon-credit NFT or register credits with an external carbon registry.

## Protocol flow

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

### Contract rules and economics

| Value                        | Contract representation                                   |
| ---------------------------- | --------------------------------------------------------- |
| Waste and product quantities | Integer kilograms                                         |
| Worker payment               | Integer Kenyan shillars recorded as KES                   |
| HX token                     | ERC-20 with 18 decimals and symbol `HXT`                  |
| Mock USDC                    | ERC-20 with 6 decimals and symbol `mUSDC`                 |
| Oracle price                 | USD with 8 decimals, for example `100e8` for $100 per ton |
| Carbon-credit amount         | Hundredths of a metric ton, so `100` means `1.00` ton     |
| Carbon savings               | `400e18` scaled units per kilogram                        |
| Default carbon price         | $100 per metric ton                                       |
| Default platform fee         | 2%                                                        |
| Maximum platform fee         | 10%                                                       |
| HX redemption                | Nominal 1 HX to 1 USDC, less network fees                 |

`processWaste` requires at least 10 kg, at least one worker, and a worker payment greater than zero. It mints `floor(kg / 10) * 1e18` HX and accrues `kg * 400e18` scaled CO2 units. A buyer can purchase no more than the farmer's available recorded credits.

The frontend currently requires registration and owner verification before allowing a farmer to submit a waste record. The contract's `processWaste` registration check is still disabled, so this access rule must be restored or otherwise enforced before production use. Likewise, `buyCarbonCredits` checks that the farmer is registered but does not currently require `verifiedFarmers[farmer]`; review this before relying on verification for credit sales.

## Contract architecture

| Contract          | File                                                               | Responsibility                                                                                              |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `HarvestX`        | [`src/HarvestX.sol`](src/HarvestX.sol)                             | Coordinates farmers, waste records, carbon credits, pricing, purchases, redemption, and owner configuration |
| `HarvestXToken`   | [`src/HarvestXToken.sol`](src/HarvestXToken.sol)                   | ERC-20 HX token with owner-controlled minting and burning                                                   |
| `MockUSDC`        | [`test/mocks/MockUSDC.sol`](test/mocks/MockUSDC.sol)               | Six-decimal test stablecoin and development faucet                                                          |
| `MockPriceOracle` | [`test/mocks/MockPriceOracle.sol`](test/mocks/MockPriceOracle.sol) | Development carbon-price oracle, defaulting to $100 per ton                                                 |

The deployment script deploys the four contracts in dependency order, wires their addresses into `HarvestX`, and transfers HX token ownership to `HarvestX` so the main contract can mint farmer rewards.

The frontend keeps the deployed addresses and ABIs under [`web/lib/contracts`](web/lib/contracts). The main address map is [`web/lib/contracts/HarvestXAbi.ts`](web/lib/contracts/HarvestXAbi.ts).

## Repository layout

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

## Requirements

Install the following before working on the project:

- Git
- Foundry, including Forge and Cast
- Node.js `20.9.0` or newer
- npm
- A browser wallet that can connect to Sepolia
- Sepolia test ETH for transaction fees
- A WalletConnect Cloud project ID for the frontend

The contracts use Solidity `0.8.20` and OpenZeppelin. Foundry dependencies are Git submodules under `lib/`.

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd harvest_x
```

If the repository is already checked out, initialize its submodules:

```bash
git submodule update --init --recursive
```

### 2. Install contract dependencies and verify the build

The repository already contains the Solidity sources and Foundry configuration. From the repository root, run:

```bash
forge build
forge test
```

If dependencies need to be refreshed, the repository also provides:

```bash
forge update
```

### 3. Install frontend dependencies

The frontend is a separate npm application:

```bash
cd web
npm ci
cd ..
```

### 4. Configure the frontend

Create [`web/.env.local`](web/.env.local) with the WalletConnect project ID used by RainbowKit:

```dotenv
NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect-project-id>
```

The current frontend is configured for Sepolia in [`web/lib/config.ts`](web/lib/config.ts) and uses the Tenderly Sepolia gateway. The RPC URL is currently defined in that file rather than read from an environment variable. If you use another Sepolia provider, update the transport there.

### 5. Configure deployment variables

Create [`.env`](.env) in the repository root when deploying to Sepolia. The root `.env` file is ignored by Git and must never be committed.

```dotenv
SEPOLIA_RPC_URL=<your-sepolia-rpc-url>
PRIVATE_KEY=<test-wallet-private-key>
ETHERSCAN_API_KEY=<etherscan-api-key>
HARVESTX_SEPOLIA=<deployed-harvestx-address>
SEPOLIA_MOCK_USDC=<deployed-mock-usdc-address>
SEPOLIA_MOCK_ORACLE=<deployed-mock-oracle-address>
FUND_AMOUNT_USDC=<amount-in-six-decimal-units>
```

`SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and `ETHERSCAN_API_KEY` are used by the deployment target. The address variables are used by the post-deployment configuration and funding targets. `FUND_AMOUNT_USDC` must be a raw MockUSDC amount with six decimals; for example, `1000000` represents one USDC.

Use a dedicated testnet wallet. Never put a private key, RPC credential, or API secret in source code, frontend environment variables, or documentation.

## Run the project locally

### Contract development

Run the deterministic Foundry test suite:

```bash
forge test
```

Generate a gas report for the full suite:

```bash
forge test --gas-report
```

Format Solidity code when needed:

```bash
forge fmt
```

To start the local Anvil node defined by the Makefile:

```bash
make anvil
```

The tests are the recommended local workflow because they deploy and exercise the complete contract stack without requiring a wallet.

### Frontend development

From the repository root:

```bash
cd web
npm run dev
```

Open `http://localhost:3000` in a browser. Connect a wallet and switch it to Sepolia when prompted.

The available frontend checks are:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

`npm start` serves an existing production build. Run `npm run build` first.

## Sepolia deployment

### Deploy the complete stack

The full deployment script deploys `MockUSDC`, `MockPriceOracle`, `HarvestXToken`, and `HarvestX`, then transfers HX token ownership to the main contract.

With the root `.env` configured, run:

```bash
make deploy-sepolia
```

The command uses the private key to broadcast transactions and the Etherscan API key to verify the contracts. Record the addresses emitted by the script and the latest file under `broadcast/DeployHarvestX.s.sol/11155111/`.

### Update an existing deployment

If you only need to replace the mock dependencies for an existing `HarvestX` deployment, deploy the mocks first:

```bash
make deploy-mocks-sepolia
```

Set `HARVESTX_SEPOLIA`, `SEPOLIA_MOCK_USDC`, and `SEPOLIA_MOCK_ORACLE` to the relevant addresses, then point the existing contract at the new mocks:

```bash
make configure-mocks-sepolia
```

The wallet used by `configure-mocks-sepolia` must be the `HarvestX` owner because the configuration functions are owner-only. The wallet used by `deploy-mocks-sepolia` becomes the owner of the newly deployed `MockUSDC`.

### Fund redemption reserves

Redemption requires MockUSDC to be held by the `HarvestX` contract. Set `FUND_AMOUNT_USDC` to the raw six-decimal amount and run:

```bash
make fund-harvestx-usdc-sepolia
```

The wallet used by this command must be the `MockUSDC` owner because the script calls `MockUSDC.mint`.

### Current Sepolia deployment

The addresses currently used by the frontend are:

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| `HarvestX`        | `0x0bb5B927aED4FE97483b0bF72AD9999Fd9BB3195` |
| `HarvestXToken`   | `0x377175AFb7E98c3302E4d47D570AfED6374AD658` |
| `MockUSDC`        | `0x59Ca3C55C723674cD7Be54cEE7CcD735168bafd1` |
| `MockPriceOracle` | `0x6257Fcf9BBD032168E39aF1349f1EE3598229EB7` |
| Network           | Ethereum Sepolia                             |
| Chain ID          | `11155111`                                   |

The authoritative deployment record is [`broadcast/DeployHarvestX.s.sol/11155111/run-latest.json`](broadcast/DeployHarvestX.s.sol/11155111/run-latest.json). When deploying a new stack, update the address constants in `HarvestXAbi.ts`, `MockUsdcAbi.ts`, `MockPriceOracleAbi.ts`, and `HarvestXTokenAbi.ts` so all frontend calls target the same deployment.

## Using the application

### Farmer workflow

1. Connect a Sepolia wallet.
2. Open **Dashboard** and select **Register as Farmer**.
3. Ask the contract owner to verify the address from the **Admin** page.
4. Open **Process Waste** and enter:
   - collected kilograms, at least 10;
   - waste type;
   - number of workers;
   - total worker payment in KES.
5. Confirm the transaction. The contract updates impact metrics, accrues carbon savings, and mints HX.
6. Use **Mint Tokens** to claim additional HX for compost, fertilizer, or biochar output.
7. Review balances, impact, and transaction history in **Balance** and **History**.

### Buyer workflow

1. Connect a Sepolia wallet.
2. Open **Balance** and use the MockUSDC faucet. `quickFaucet` sends 10,000 test USDC per call. Although the contract exposes `hasUsedFaucet`, the current mock does not mark claims as used, so the faucet can be called repeatedly while the mock has funds.
3. Open **Carbon Credits** and switch to **Corporate Buyer**.
4. Enter the farmer address and the desired tons of CO2.
5. Review the on-chain price calculation. The UI sends tons as hundredths of a ton; `1.5` becomes `150` on-chain.
6. Approve MockUSDC when prompted. The purchase hook waits for approval to confirm before submitting the purchase.
7. Confirm the purchase. MockUSDC is transferred to `HarvestX`, the platform fee remains in the contract, and the farmer receives the remainder.

### Redemption workflow

1. Accumulate HX through waste processing or product claims.
2. Have the farmer verified by the contract owner.
3. Ensure the `HarvestX` contract has enough MockUSDC for the redemption amount.
4. Open **Balance**, enter an HX amount, and submit the redemption.
5. The contract burns the farmer's HX and transfers the equivalent MockUSDC to the farmer.

### Administrator workflow

The **Admin** page is available only to the `HarvestX` owner. It can:

- verify or revoke a registered farmer;
- set the minimum carbon-credit price;
- set the platform fee up to 10%;
- replace the price oracle;
- withdraw accumulated platform USDC.

## Frontend routes

| Route             | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `/`               | HarvestX landing page and product overview                 |
| `/dashboard`      | Farmer registration and impact summary                     |
| `/process`        | Waste processing form and carbon/reward preview            |
| `/mint`           | Product-token claims                                       |
| `/carbon-credits` | Farmer credit view and corporate buyer flow                |
| `/balance`        | HX and MockUSDC balances, faucet, redemption, and activity |
| `/history`        | Waste, product, and redemption event history               |
| `/profile`        | Connected-wallet profile information                       |
| `/admin`          | Owner-only verification and configuration controls         |

## Testing and verification

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

### WalletConnect project missing

Set `NEXT_PUBLIC_WC_PROJECT_ID` in `web/.env.local`, restart the Next.js server, and reload the browser.

### Foundry dependency errors

Initialize the Git submodules again:

```bash
git submodule update --init --recursive
forge build
```

## Authors

HarvestX is developed and maintained by:

- Osbon Keya
- Stephen Mburu
