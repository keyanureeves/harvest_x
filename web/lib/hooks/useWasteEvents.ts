import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

// WasteProcessed events carry the per-collection data (including the tx hash)
// that the history timeline needs. units: kg is plain kg, tokensMinted is
// 18 decimals, CO2Saved is grams at 18 decimals, timestamp is seconds.
export type WasteEvent = {
  kg: bigint;
  tokensMinted: bigint;
  co2Saved: bigint;
  workersInvolved: bigint;
  workerPaymentKES: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
};

export function useWasteEvents() {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const publicClient = usePublicClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["wasteEvents", contractAddress, address],
    queryFn: async (): Promise<WasteEvent[]> => {
      if (!address || !publicClient) return [];
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event WasteProcessed(address indexed farmer, uint256 kg, uint256 tokensMinted, uint256 CO2Saved, uint256 wworkersInvolved, uint256 workerPayment, uint256 timestamp)",
        ),
        args: { farmer: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      return logs.map((log) => ({
        kg: log.args.kg ?? BigInt(0),
        tokensMinted: log.args.tokensMinted ?? BigInt(0),
        co2Saved: log.args.CO2Saved ?? BigInt(0),
        workersInvolved: log.args.wworkersInvolved ?? BigInt(0),
        workerPaymentKES: log.args.workerPayment ?? BigInt(0),
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