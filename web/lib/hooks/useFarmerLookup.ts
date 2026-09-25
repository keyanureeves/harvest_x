import { useAccount, useReadContract } from "wagmi";
import { getAddress, isAddress } from "viem";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

// Admin-only lookup for an arbitrary farmer address (not the connected wallet).
export function useFarmerLookup(address?: string) {
  const { chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const enabled = !!address && isAddress(address);
  const resolved = enabled ? getAddress(address) : undefined;

  const {
    data: farmerData,
    isLoading,
    refetch: refetchFarmer,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "farmers",
    args: resolved ? [resolved] : undefined,
    query: { enabled },
  });

  const {
    data: verified,
    refetch: refetchVerified,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "verifiedFarmers",
    args: resolved ? [resolved] : undefined,
    query: { enabled },
  });

  const farmer = farmerData as readonly [boolean, ...unknown[]] | undefined;

  const refetch = async () => {
    await Promise.allSettled([refetchFarmer(), refetchVerified()]);
  };

  return {
    isRegistered: farmer?.[0] ?? false,
    isVerified: verified as boolean | undefined,
    isLoading,
    refetch,
  };
}