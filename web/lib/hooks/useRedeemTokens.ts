import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

// redeemHxForStablecoin(_hxAmount) burns 18-decimal HX tokens and pays out
// 6-decimal USDC at 1:1 (a full HX token = 1 USDC). Only verified farmers can
// redeem. checkRedemptionStatus gates the flow with the same checks the
// contract runs on write.
type RedemptionStatusTuple = readonly [
  canRedeem: boolean,
  reason: string,
  usdcAmount: bigint,
  contractUSDCBalance: bigint,
  userHXBalance: bigint,
  isRegistered: boolean,
  isVerified: boolean,
];

export function useRedeemTokens(hxAmount: bigint | undefined) {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const enabled = !!address && hxAmount !== undefined && hxAmount >= BigInt(0);

  const {
    data: status,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "checkRedemptionStatus",
    args: hxAmount !== undefined ? [hxAmount] : undefined,
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

  const info = (status as unknown as RedemptionStatusTuple | undefined) ?? [
    false,
    "",
    BigInt(0),
    BigInt(0),
    BigInt(0),
    false,
    false,
  ];

  // Refetch status after a confirmed redemption so gating reflects new balances
  useEffect(() => {
    if (isConfirmed) {
      void refetchStatus();
    }
  }, [isConfirmed, refetchStatus]);

  const redeem = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    if (!hxAmount || hxAmount <= BigInt(0)) {
      throw new Error("Redemption amount must be greater than zero");
    }

    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    console.log("redeemHxForStablecoin with contract:", contractAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      await writeContract({
        address: contractAddress,
        abi: HARVEST_X_ABI,
        functionName: "redeemHxForStablecoin",
        args: [hxAmount],
      });
    } catch (err) {
      console.error("redeemHxForStablecoin error:", err);
      throw err;
    }
  };

  return {
    canRedeem: !!info[0],
    reason: String(info[1] ?? ""),
    usdcAmount: info[2],
    contractUSDCBalance: info[3],
    userHXBalance: info[4],
    isRegistered: !!info[5],
    isVerified: !!info[6],
    isStatusLoading,
    isConnected: !!address,
    needsNetworkSwitch,
    isSwitching,
    redeem,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
    refetch: refetchStatus,
  };
}