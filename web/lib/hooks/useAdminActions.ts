import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

function useAdminWriteAction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  return { writeContract, hash, isPending, isConfirming, isConfirmed, error };
}

type AdminFunctionName =
  | "verifyFarmer"
  | "revokeVerification"
  | "setMinPricePerTon"
  | "setPlatformFee"
  | "updateOracle"
  | "withdrawPlatformFees";

export function useAdminActions() {
  const { address, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const verify = useAdminWriteAction();
  const revoke = useAdminWriteAction();
  const minPrice = useAdminWriteAction();
  const fee = useAdminWriteAction();
  const oracle = useAdminWriteAction();
  const withdraw = useAdminWriteAction();

  const execute = async (
    action: ReturnType<typeof useAdminWriteAction>,
    functionName: AdminFunctionName,
    args: readonly unknown[],
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Prompt network switch to Sepolia first if needed
    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    const resolvedAddress = getContractAddress(sepolia.id);

    console.log(`${functionName} with contract:`, resolvedAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      await action.writeContract({
        address: resolvedAddress,
        abi: HARVEST_X_ABI,
        functionName: functionName as never,
        args: args as never,
      });
    } catch (err) {
      console.error(`${functionName} error:`, err);
      throw err;
    }
  };

  return {
    verifyFarmer: (farmer: `0x${string}`) =>
      execute(verify, "verifyFarmer", [farmer]),
    revokeVerification: (farmer: `0x${string}`) =>
      execute(revoke, "revokeVerification", [farmer]),
    setMinPricePerTon: (price: bigint) =>
      execute(minPrice, "setMinPricePerTon", [price]),
    setPlatformFee: (feePercentage: bigint) =>
      execute(fee, "setPlatformFee", [feePercentage]),
    updateOracle: (oracleAddress: `0x${string}`) =>
      execute(oracle, "updateOracle", [oracleAddress]),
    // withdrawPlatformFees amount is USDC (6 decimals)
    withdrawFees: (amountUSDC: bigint) =>
      execute(withdraw, "withdrawPlatformFees", [amountUSDC]),
    isSwitching,
    verify,
    revoke,
    minPrice,
    fee,
    oracle,
    withdraw,
  };
}