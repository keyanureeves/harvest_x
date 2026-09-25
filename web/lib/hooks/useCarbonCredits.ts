import { useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";
import { MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/MockUsdcAbi";
import {
  MOCK_PRICE_ORACLE_ABI,
  MOCK_ORACLE_ADDRESS,
} from "@/lib/contracts/MockPriceOracleAbi";

// Keep the transaction below the Sepolia RPC gas-limit cap reported by the provider.
const RPC_GAS_LIMIT_CAP = BigInt(16_777_216);

// getAvailableCarbonCredits(address) returns:
// [available, totalEarned, sold, estimatedValueUSDC]
// available/totalEarned/sold are hundredths of a ton; estimatedValueUSDC is 6 decimals.
type CarbonCreditsTuple = readonly [
  available: bigint,
  totalEarned: bigint,
  sold: bigint,
  estimatedValueUSDC: bigint,
];

// calculatePriceInUSDC returns [priceUSD, priceUSDC]; priceUSD is 8-decimals,
// priceUSDC is 6-decimals. Both include the platform fee via the oracle rate.
export type BuyPriceCalculation = {
  priceUSD: bigint;
  priceUSDC: bigint;
};

export type BuyCarbonCreditsInput = {
  farmerAddress: `0x${string}`;
  tonsCO2: number; // decimal tons, e.g. 1.5; contract expects hundredths
  amountUSDC: number; // USDC the buyer is paying (6 decimals on-chain)
};

export function useCarbonCredits(farmerAddress?: string) {
  const { address, chainId, isConnected } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const publicClient = usePublicClient();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const target = (farmerAddress as `0x${string}` | undefined) ?? address;
  const enabled = !!target;

  const {
    data: creditsData,
    isLoading,
    isError,
    error: errorCredits,
    refetch: refetchCredits,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "getAvailableCarbonCredits",
    args: target ? [target] : undefined,
    query: { enabled },
  });

  // USDC allowance the HarvestX contract has been approved to spend on the buyer's behalf
  const {
    data: allowance = BigInt(0),
    refetch: refetchAllowance,
  } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: { enabled: !!address },
  });

  // Carbon price per ton (8-decimal USD, e.g. 100e8 = $100/ton), oracle-driven
  const {
    data: pricePerTonRaw,
    refetch: refetchPrice,
  } = useReadContract({
    address: MOCK_ORACLE_ADDRESS,
    abi: MOCK_PRICE_ORACLE_ABI,
    functionName: "getCarbonCreditPricePerTon",
  });

  const credits = (creditsData as unknown as CarbonCreditsTuple | undefined);

  // 1) approve USDC spend for the contract, 2) submit the purchase
  const {
    writeContractAsync: writeApproveAsync,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveApproved } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract,
    data: hash,
    isPending,
    error: errorBuy,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const needsNetworkSwitch = isConnected && chainId !== sepolia.id;

  // Refetch stats + allowance + price after a confirmed purchase
  useEffect(() => {
    if (isConfirmed) {
      void refetchCredits();
      void refetchAllowance();
      void refetchPrice();
    }
  }, [isConfirmed, refetchCredits, refetchAllowance, refetchPrice]);

  // Read price straight from the contract so the summary always matches on-chain math
  const calculatePrice = async (
    tonsCO2: number,
  ): Promise<BuyPriceCalculation | null> => {
    if (!publicClient || !contractAddress || tonsCO2 <= 0) return null;
    const tonsUnits = BigInt(Math.round(tonsCO2 * 100));
    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: HARVEST_X_ABI,
        functionName: "calculatePriceInUSDC",
        args: [tonsUnits],
      });
      const [priceUSD, priceUSDC] = result as [bigint, bigint];
      return { priceUSD, priceUSDC };
    } catch (err) {
      console.error("Price calculation error:", err);
      return null;
    }
  };

  const buyCarbonCredits = async (input: BuyCarbonCreditsInput) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    if (input.tonsCO2 <= 0) {
      throw new Error("Tons must be greater than 0");
    }
    if (!input.farmerAddress || input.farmerAddress.length !== 42) {
      throw new Error("Invalid farmer address");
    }
    if (input.amountUSDC <= 0) {
      throw new Error("USDC amount must be greater than zero");
    }
    if (!publicClient) {
      throw new Error("Public client unavailable");
    }

    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    const tonsUnits = BigInt(Math.round(input.tonsCO2 * 100));
    const amountUSDCBigInt = parseUnits(String(input.amountUSDC), 6);

    // The contract pulls USDC via transferFrom, so approve spend first if needed
    if ((allowance ?? BigInt(0)) < amountUSDCBigInt) {
      try {
        const approvalHash = await writeApproveAsync({
          address: MOCK_USDC_ADDRESS,
          abi: MOCK_USDC_ABI,
          functionName: "approve",
          args: [contractAddress, amountUSDCBigInt],
        });

        // Wait for approval to be mined before estimating the purchase.
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      } catch (err) {
        console.error("USDC approval error:", err);
        throw err;
      }
      await refetchAllowance();
    }

    console.log("buyCarbonCredits with contract:", contractAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      // Estimate against the buyer's current state before sending the transaction.
      const estimatedGas = await publicClient.estimateContractGas({
        address: contractAddress,
        abi: HARVEST_X_ABI,
        functionName: "buyCarbonCredits",
        args: [input.farmerAddress, tonsUnits, amountUSDCBigInt],
        account: address,
      });

      // Leave a 20% buffer for state changes without exceeding the RPC cap.
      const gasLimit = estimatedGas + estimatedGas / BigInt(5);
      if (gasLimit > RPC_GAS_LIMIT_CAP) {
        throw new Error(
          `Estimated gas limit ${gasLimit.toString()} exceeds the RPC cap ${RPC_GAS_LIMIT_CAP.toString()}`,
        );
      }

      console.log(
        "buyCarbonCredits gas estimate:",
        estimatedGas.toString(),
        "gas limit:",
        gasLimit.toString(),
      );

      await writeContract({
        address: contractAddress,
        abi: HARVEST_X_ABI,
        functionName: "buyCarbonCredits",
        args: [input.farmerAddress, tonsUnits, amountUSDCBigInt],
        gas: gasLimit,
      });
    } catch (err) {
      console.error("buyCarbonCredits error:", err);
      throw err;
    }
  };

  const refetch = async () => {
    await Promise.allSettled([
      refetchCredits(),
      refetchAllowance(),
      refetchPrice(),
    ]);
  };

  return {
    carbonCredits: credits
      ? {
          availableTons: credits[0],
          totalEarnedTons: credits[1],
          soldTons: credits[2],
          estimatedValueUSDC: credits[3],
        }
      : null,
    pricePerTonUSD: pricePerTonRaw !== undefined ? Number(pricePerTonRaw) / 1e8 : 0,
    allowance: allowance as bigint,
    isLoading,
    isError,
    error: errorCredits,
    calculatePrice,
    buyCarbonCredits,
    isConnected,
    needsNetworkSwitch,
    isSwitching,
    isApprovePending,
    isApproveConfirming,
    isApproveApproved,
    approveError,
    isPending,
    isConfirming,
    isConfirmed,
    errorBuy,
    hash,
    refetch,
  };
}