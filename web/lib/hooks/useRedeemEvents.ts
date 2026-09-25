import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

// Redeemed events are the only per-redeem records on-chain (there is no
// redeem history array). Units: owgAmount is 18 decimals, usdcAmount is 6
// decimals. The contract emits no timestamp, so we read it from each event's
// block and order by timestamp.
export type RedeemEvent = {
  owgAmount: bigint;
  usdcAmount: bigint;
  timestamp: number; // ms epoch, read from the event's block
  transactionHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
};

export function useRedeemEvents() {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const publicClient = usePublicClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["redeemEvents", contractAddress, address],
    queryFn: async (): Promise<RedeemEvent[]> => {
      if (!address || !publicClient) return [];
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event Redeemed(address indexed farmer, uint256 owgAmount, uint256 usdcAmount)",
        ),
        args: { farmer: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      // Redeemed has no timestamp arg — fetch each event's block once.
      const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
      const blockTimestamps = await Promise.all(
        blockNumbers.map(async (bn) => {
          const block = await publicClient.getBlock({ blockNumber: bn });
          return Number(block.timestamp) * 1000;
        }),
      );
      const tsByBlock = new Map<bigint, number>(
        blockNumbers.map((bn, i) => [bn, blockTimestamps[i]]),
      );

      return logs.map((log) => ({
        owgAmount: log.args.owgAmount ?? BigInt(0),
        usdcAmount: log.args.usdcAmount ?? BigInt(0),
        timestamp: tsByBlock.get(log.blockNumber) ?? 0,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber ?? BigInt(0),
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