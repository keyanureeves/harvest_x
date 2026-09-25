import { useAccount, useReadContract } from "wagmi";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

export function useAdminGate() {
  const { address, chainId, isConnected } = useAccount();
  const contractAddress = getContractAddress(chainId);

  const { data: owner, isLoading } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "owner",
  });

  const ownerAddress = owner as `0x${string}` | undefined;
  const isOwner =
    isConnected &&
    !!address &&
    ownerAddress !== undefined &&
    address.toLowerCase() === ownerAddress.toLowerCase();

  return {
    isConnected,
    isOwner,
    owner: ownerAddress,
    isLoading,
  };
}