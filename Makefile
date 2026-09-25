-include .env

 deploy-sepolia:;
	forge script script/DeployHarvestX.s.sol:DeployHarvestX --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY)  --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

 deploy-mocks-sepolia:;
	forge script script/DeployMocks.s.sol:DeployMocks --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

 configure-mocks-sepolia:;
	forge script script/Interactions.s.sol:ConfigureMocksHarvestX --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast $(HARVESTX_SEPOLIA) $(SEPOLIA_MOCK_USDC) $(SEPOLIA_MOCK_ORACLE) -vvvv

 fund-harvestx-usdc-sepolia:;
	forge script script/Interactions.s.sol:FundHarvestXUSDC --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast $(SEPOLIA_MOCK_USDC) $(HARVESTX_SEPOLIA) $(FUND_AMOUNT_USDC) -vvvv

all: clean remove install update build

update:; forge update

zkbuild :; forge build --zksync

test :; forge test

zktest :; foundryup-zksync && forge test --zksync && foundryup

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1