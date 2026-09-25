import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

// ProductClaimed events are the only per-claim product records on-chain
// (there is no product history array). Units: productKg is plain kg,
// tokensminted is 18 decimals, timestamp is seconds.
export type ProductEvent = {
  productKg: bigint;
  tokensMinted: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
};

export function useProductEvents() {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const publicClient = usePublicClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["productEvents", contractAddress, address],
    queryFn: async (): Promise<ProductEvent[]> => {
      if (!address || !publicClient) return [];
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event ProductClaimed(address indexed farmer, uint256 productKg, uint256 tokensminted, uint256 timestamp)",
        ),
        args: { farmer: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      return logs.map((log) => ({
        productKg: log.args.productKg ?? BigInt(0),
        tokensMinted: log.args.tokensminted ?? BigInt(0),
        timestamp: log.args.timestamp ?? BigInt(0),
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      }));
    },
    enabled: !!address && !!publicClient,
    retry: false,
  });

  return {
    events: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}