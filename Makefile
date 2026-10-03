-include .env

COUNT?=5
LABEL?=tester
TESTER_GAS_TOPUP?=0.05ether

 deploy-sepolia:;
	forge script script/DeployHarvestX.s.sol:DeployHarvestX --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY)  --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

 deploy-mocks-sepolia:;
	forge script script/DeployMocks.s.sol:DeployMocks --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

 configure-mocks-sepolia:;
	forge script script/Interactions.s.sol:ConfigureMocksHarvestX --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast $(HARVESTX_SEPOLIA) $(SEPOLIA_MOCK_USDC) $(SEPOLIA_MOCK_ORACLE) -vvvv

 fund-harvestx-usdc-sepolia:;
	forge script script/Interactions.s.sol:FundHarvestXUSDC --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast $(SEPOLIA_MOCK_USDC) $(HARVESTX_SEPOLIA) $(FUND_AMOUNT_USDC) -vvvv

# Generates throwaway Sepolia wallets for testers. COUNT=5 LABEL=jane
 demo-wallets:;
	./script/GenerateDemoWallets.sh $(COUNT) $(LABEL)

# Funds + registers + verifies every wallet in demo-testers.keys.csv so testers
# can use the farmer flow without contacting the owner.
 onboard-testers-sepolia:;
	@test -f demo-testers.keys.csv || { echo "run 'make demo-wallets' first"; exit 1; }
	@if git ls-files --error-unmatch demo-testers.keys.csv >/dev/null 2>&1; then echo "ABORT: demo-testers.keys.csv is tracked by git"; exit 1; fi
	forge script script/OnboardTesters.s.sol:OnboardTesters --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast $(HARVESTX_SEPOLIA) demo-testers.keys.csv $(TESTER_GAS_TOPUP) -vv

all: clean remove install update build

update:; forge update

zkbuild :; forge build --zksync

test :; forge test

zktest :; foundryup-zksync && forge test --zksync && foundryup

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1