import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

// claimProductTokens(uint256 _productKg) mints productKg/10 tokens (18 decimals)
// to the caller and emits ProductClaimed. The contract requires productKg > 0.
export type ClaimTokensInput = {
  productKg: bigint;
};

export function useClaimTokens() {
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

  const claimProduct = async (input: ClaimTokensInput) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (input.productKg <= BigInt(0)) {
      throw new Error("Product amount must be greater than zero");
    }

    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    const resolvedAddress = getContractAddress(sepolia.id);

    console.log("Claiming product tokens with contract:", resolvedAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      await writeContract({
        address: resolvedAddress,
        abi: HARVEST_X_ABI,
        functionName: "claimProductTokens",
        args: [input.productKg],
      });
    } catch (err) {
      console.error("Claim product tokens error:", err);
      throw err;
    }
  };

  return {
    isConnected: !!address,
    needsNetworkSwitch,
    isSwitching,
    claimProduct,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}