import { useAccount, useReadContract } from "wagmi";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";
import {
  HARVEST_X_TOKEN_ABI,
  HARVEST_X_TOKEN_ADDRESS,
} from "@/lib/contracts/HarvestXTokenAbi";

// farmers(address) returns:
// [isRegistered, totalWasteKg, totalCO2Saved, totalProductKg, totalWorkersPaid, totalPayoutKES]
type FarmerTuple = readonly [
  isRegistered: boolean,
  totalWasteKg: bigint,
  totalCO2Saved: bigint,
  totalProductKg: bigint,
  totalWorkersPaid: bigint,
  totalPayoutKES: bigint,
];

// getImpact(address) returns:
// [wasteKg, productKg, co2Grams, co2Kg, tokens, workersPaid, totalPayoutKES]
type ImpactTuple = readonly [
  wasteKg: bigint,
  productKg: bigint,
  co2Grams: bigint,
  co2Kg: bigint,
  tokens: bigint,
  workersPaid: bigint,
  totalPayoutKES: bigint,
];

// getAvailableCarbonCredits(address) returns:
// [available, totalEarned, sold, estimatedValueUSDC]
// available/totalEarned/sold are hundredths of a ton; estimatedValueUSDC is 6 decimals
type CarbonCreditsTuple = readonly [
  available: bigint,
  totalEarned: bigint,
  sold: bigint,
  estimatedValueUSDC: bigint,
];

export function useFarmerData() {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const enabled = !!address;

  const {
    data: farmerData,
    isLoading: isFarmerLoading,
    refetch: refetchFarmer,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "farmers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: isVerified,
    refetch: refetchVerified,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "verifiedFarmers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: impactData,
    isLoading: isImpactLoading,
    refetch: refetchImpact,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "getImpact",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: creditsData,
    isLoading: isCreditsLoading,
    refetch: refetchCredits,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "getAvailableCarbonCredits",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: tokenBalance,
    refetch: refetchTokenBalance,
  } = useReadContract({
    address: HARVEST_X_TOKEN_ADDRESS,
    abi: HARVEST_X_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const farmer = farmerData as unknown as FarmerTuple | undefined;
  const impact = impactData as unknown as ImpactTuple | undefined;
  const credits = creditsData as unknown as CarbonCreditsTuple | undefined;

  const refetch = async () => {
    await Promise.allSettled([
      refetchFarmer(),
      refetchVerified(),
      refetchImpact(),
      refetchCredits(),
      refetchTokenBalance(),
    ]);
  };

  return {
    isRegistered: farmer?.[0] ?? false,
    totalWasteKg: farmer?.[1] ?? BigInt(0),
    totalCO2Saved: farmer?.[2] ?? BigInt(0),
    totalProductKg: farmer?.[3] ?? BigInt(0),
    totalWorkersPaid: farmer?.[4] ?? BigInt(0),
    totalPayoutKES: farmer?.[5] ?? BigInt(0),
    isVerified: isVerified as boolean | undefined,
    impact: {
      wasteKg: impact?.[0] ?? BigInt(0),
      productKg: impact?.[1] ?? BigInt(0),
      co2Grams: impact?.[2] ?? BigInt(0),
      co2Kg: impact?.[3] ?? BigInt(0),
      tokens: impact?.[4] ?? BigInt(0),
      workersPaid: impact?.[5] ?? BigInt(0),
      totalPayoutKES: impact?.[6] ?? BigInt(0),
    },
    carbonCredits: {
      available: credits?.[0] ?? BigInt(0),
      totalEarned: credits?.[1] ?? BigInt(0),
      sold: credits?.[2] ?? BigInt(0),
      estimatedValueUSDC: credits?.[3] ?? BigInt(0),
    },
    tokenBalance: tokenBalance as bigint | undefined,
    isLoading: isFarmerLoading || isImpactLoading || isCreditsLoading,
    refetch,
  };
}