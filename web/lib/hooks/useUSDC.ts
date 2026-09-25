import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/MockUsdcAbi";

// MockUSDC is a 6-decimal ERC20 with a quickFaucet() that sends 10,000 USDC.
// hasUsedFaucet is a public mapping getter; the deployed mock currently never
// sets it, so it reflects on-chain state without enforcing one-time claims.
export function useUSDC() {
  const { address, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const enabled = !!address;

  const {
    data: balance = BigInt(0),
    isLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: hasFaucetUsed = false,
    refetch: refetchFaucetUsed,
  } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "hasUsedFaucet",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const needsNetworkSwitch = chainId !== sepolia.id;

  // Refetch USDC balance after a faucet claim is confirmed
  useEffect(() => {
    if (isConfirmed) {
      void refetchBalance();
      void refetchFaucetUsed();
    }
  }, [isConfirmed, refetchBalance, refetchFaucetUsed]);

  const requestFaucet = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    console.log("Claiming USDC faucet at:", MOCK_USDC_ADDRESS);
    console.log("Chain ID:", sepolia.id);

    try {
      await writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "quickFaucet",
        args: [],
      });
    } catch (err) {
      console.error("USDC faucet error:", err);
      throw err;
    }
  };

  const refetch = async () => {
    await Promise.allSettled([refetchBalance(), refetchFaucetUsed()]);
  };

  return {
    balance: balance as bigint,
    formatted: Number(formatUnits(balance as bigint, 6)),
    decimals: 6,
    hasFaucetUsed: hasFaucetUsed as boolean,
    isConnected: !!address,
    needsNetworkSwitch,
    isSwitching,
    requestFaucet,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
    isLoading,
    refetch,
  };
}