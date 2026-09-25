import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

// The FarmerData struct has no registration date, so the join date is taken
// from the first FarmerRegistered event for the farmer. Returns ms epoch.
export function useFarmerJoined() {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const publicClient = usePublicClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["farmerJoined", contractAddress, address],
    queryFn: async () => {
      if (!address || !publicClient) return null;
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event FarmerRegistered(address indexed farmer, uint256 timestamp)",
        ),
        args: { farmer: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      if (logs.length === 0) return null;
      return {
        joinedAtMs: Number(logs[0].args.timestamp ?? BigInt(0)) * 1000,
        transactionHash: logs[0].transactionHash,
      };
    },
    enabled: !!address && !!publicClient,
  });

  return {
    joinedAtMs: data?.joinedAtMs ?? null,
    isLoading,
    refetch,
  };
}