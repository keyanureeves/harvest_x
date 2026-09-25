import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

export type ProcessWasteInput = {
  collectedWasteKg: bigint;
  wasteType: string;
  workersInvolved: bigint;
  workersPaymentKES: bigint;
};

export function useProcessWaste() {
  const { address, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const needsNetworkSwitch = chainId !== sepolia.id;

  const processWaste = async (input: ProcessWasteInput) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    const resolvedAddress = getContractAddress(sepolia.id);

    console.log("Processing waste with contract:", resolvedAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      await writeContract({
        address: resolvedAddress,
        abi: HARVEST_X_ABI,
        functionName: "processWaste",
        args: [
          input.collectedWasteKg,
          input.wasteType,
          input.workersInvolved,
          input.workersPaymentKES,
        ],
      });
    } catch (err) {
      console.error("Process waste error:", err);
      throw err;
    }
  };

  return {
    isConnected: !!address,
    needsNetworkSwitch,
    isSwitching,
    processWaste,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}