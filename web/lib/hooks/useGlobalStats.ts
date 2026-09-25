import { useAccount, useReadContract } from "wagmi";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

// getGlobalStats() returns:
// [farmersCount, wasteKg, co2SavedKg, tokensCirculating, carbonCreditsSolTons, platformFeesHX]
// co2SavedKg is plain kg; tokensCirculating is 18 decimals; carbonCreditsSolTons is hundredths of a ton
type GlobalStatsTuple = readonly [
  farmersCount: bigint,
  wasteKg: bigint,
  co2SavedKg: bigint,
  tokensCirculating: bigint,
  carbonCreditsSolTons: bigint,
  platformFeesHX: bigint,
];

export function useGlobalStats() {
  const { chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);

  const {
    data,
    isLoading,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "getGlobalStats",
  });

  const stats = data as unknown as GlobalStatsTuple | undefined;

  return {
    farmersCount: stats?.[0] ?? BigInt(0),
    wasteKg: stats?.[1] ?? BigInt(0),
    co2SavedKg: stats?.[2] ?? BigInt(0),
    tokensCirculating: stats?.[3] ?? BigInt(0),
    carbonCreditsSolTons: stats?.[4] ?? BigInt(0),
    platformFeesHX: stats?.[5] ?? BigInt(0),
    isLoading,
    refetch,
  };
}