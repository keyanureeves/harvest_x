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
import {
  HARVEST_X_TOKEN_ABI,
  HARVEST_X_TOKEN_ADDRESS,
} from "@/lib/contracts/HarvestXTokenAbi";
import { MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/MockUsdcAbi";

// redeemHxForStablecoin(_hxAmount) burns 18-decimal HX and pays out
// 6-decimal USDC 1:1 (1 HX == 1 USDC), and is gated by onlyVerifiedFarmer
// plus a reserve check. HX_DECIMALS(18) - USDC_DECIMALS(6) = 12, so the quote
// is hxAmount / 1e12.
//
// Eligibility is computed here rather than read from checkRedemptionStatus.
// That view function is pure, so a local mirror is equivalent -- but it avoids
// two problems that need a redeploy to fix on-chain:
//   1. It gates on msg.sender, and wagmi sends no sender for reads, so the
//      call runs as address(0) and always reports "Not registered".
//   2. Its insufficient-HX branch returns an uninitialized usdcAmount (always
//      0) and reuses the string "Insufficient USDC in contract".
// Every input below is keyed on `address` explicitly, so there is no msg.sender
// ambiguity. The checks mirror onlyVerifiedFarmer + the reserve require, in the
// same order as the contract.
const HX_DECIMALS = 18;
const USDC_DECIMALS = 6;
const DECIMAL_GAP = BigInt(10 ** (HX_DECIMALS - USDC_DECIMALS));

// farmers(address) -> [isRegistered, ...]; only the flag is needed here.
type FarmerTuple = readonly [boolean, ...unknown[]];

export function useRedeemTokens(hxAmount: bigint | undefined) {
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const usdcAddress = getContractAddress(chainId, "mockUSDC");
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const enabled = !!address;

  const {
    data: farmerData,
    isLoading: isFarmerLoading,
    isError: isFarmerError,
    refetch: refetchFarmer,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "farmers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: verified,
    isLoading: isVerifiedLoading,
    isError: isVerifiedError,
    refetch: refetchVerified,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "verifiedFarmers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: userHXBalance = BigInt(0),
    isError: isBalanceError,
    refetch: refetchHXBalance,
  } = useReadContract({
    address: HARVEST_X_TOKEN_ADDRESS,
    abi: HARVEST_X_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: contractUSDCBalance = BigInt(0),
    isError: isReserveError,
    refetch: refetchReserve,
  } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [contractAddress],
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

  const isRegistered =
    (farmerData as unknown as FarmerTuple | undefined)?.[0] ?? false;
  const isVerified = (verified as boolean | undefined) ?? false;
  const hxBalance = userHXBalance as bigint;
  const reserve = contractUSDCBalance as bigint;

  const usdcAmount = (hxAmount ?? BigInt(0)) / DECIMAL_GAP;
  const isStatusLoading = enabled && (isFarmerLoading || isVerifiedLoading);
  const isStatusError =
    isFarmerError || isVerifiedError || isBalanceError || isReserveError;

  // Same order as onlyVerifiedFarmer + redeemHxForStablecoin's requires.
  let canRedeem = false;
  let reason = "";
  if (!enabled) {
    reason = "Wallet not connected";
  } else if (!isRegistered) {
    reason = "Not registered as a farmer";
  } else if (!isVerified) {
    reason = "Farmer not verified";
  } else if ((hxAmount ?? BigInt(0)) <= BigInt(0)) {
    reason = "Amount must be > 0";
  } else if (hxBalance < (hxAmount ?? BigInt(0))) {
    reason = "Insufficient HX balance";
  } else if (reserve < usdcAmount) {
    reason = "Insufficient USDC in contract";
  } else {
    canRedeem = true;
    reason = "Ready to redeem";
  }

  const refetchStatus = async () => {
    await Promise.allSettled([
      refetchFarmer(),
      refetchVerified(),
      refetchHXBalance(),
      refetchReserve(),
    ]);
  };

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
    canRedeem,
    reason,
    usdcAmount,
    contractUSDCBalance: reserve,
    userHXBalance: hxBalance,
    isRegistered,
    isVerified,
    isStatusLoading,
    isStatusError,
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
