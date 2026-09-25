import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { parseAbiItem } from "viem";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";
import {
  HARVEST_X_TOKEN_ABI,
  HARVEST_X_TOKEN_ADDRESS,
} from "@/lib/contracts/HarvestXTokenAbi";
import { MOCK_USDC_ABI } from "@/lib/contracts/MockUsdcAbi";

// minPricePerTon and platformFeePercentage are internal (non-public) state vars,
// so there are no auto-getters. We read them from the latest MinPriceUpdated /
// PlatformFeeUpdated event logs, falling back to the contract's initial values
// when the events were never emitted. Units: minPricePerTon is 1e8 USD ($100 =
// 100e8), fee is a plain percentage (2 = 2%).
const INITIAL_MIN_PRICE_PER_TON = BigInt(100) * BigInt(10) ** BigInt(8);
const DEFAULT_FEE_PERCENTAGE = BigInt(2);

export function usePlatformConfig() {
  const { chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const usdcAddress = getContractAddress(chainId, "mockUSDC");
  const publicClient = usePublicClient();

  const {
    data: minPricePerTon = INITIAL_MIN_PRICE_PER_TON,
    isLoading: isMinPriceLoading,
    refetch: refetchMinPrice,
  } = useQuery({
    queryKey: ["minPricePerTon", contractAddress],
    queryFn: async () => {
      if (!publicClient) return INITIAL_MIN_PRICE_PER_TON;
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event MinPriceUpdated(uint256 newPrice, uint256 timestamp)",
        ),
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      if (logs.length === 0) return INITIAL_MIN_PRICE_PER_TON;
      return logs[logs.length - 1].args.newPrice;
    },
    enabled: !!publicClient,
  });

  const {
    data: platformFeePercentage = DEFAULT_FEE_PERCENTAGE,
    isLoading: isFeeLoading,
    refetch: refetchFee,
  } = useQuery({
    queryKey: ["platformFeePercentage", contractAddress],
    queryFn: async () => {
      if (!publicClient) return DEFAULT_FEE_PERCENTAGE;
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event PlatformFeeUpdated(uint256 newFee, uint256 timestamp)",
        ),
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      if (logs.length === 0) return DEFAULT_FEE_PERCENTAGE;
      return logs[logs.length - 1].args.newFee;
    },
    enabled: !!publicClient,
  });

  const {
    data: oracleAddress,
    refetch: refetchOracle,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "priceOracle",
  });

  const {
    data: feePoolUSDC = BigInt(0),
    refetch: refetchFeePool,
  } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [contractAddress],
  });

  // HarvestX token reserves held by the contract (from getGlobalStats platformFeesHX),
  // shown for reference only — withdrawPlatformFees pays out in USDC.
  const {
    data: tokenReserve = BigInt(0),
    refetch: refetchTokenReserve,
  } = useReadContract({
    address: HARVEST_X_TOKEN_ADDRESS,
    abi: HARVEST_X_TOKEN_ABI,
    functionName: "balanceOf",
    args: [contractAddress],
  });

  const refetch = async () => {
    await Promise.allSettled([
      refetchMinPrice(),
      refetchFee(),
      refetchOracle(),
      refetchFeePool(),
      refetchTokenReserve(),
    ]);
  };

  return {
    minPricePerTon,
    platformFeePercentage,
    oracleAddress: oracleAddress as `0x${string}` | undefined,
    feePoolUSDC,
    tokenReserve,
    isLoading: isMinPriceLoading || isFeeLoading,
    refetch,
  };
}