import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  HARVEST_X_TOKEN_ABI,
  HARVEST_X_TOKEN_ADDRESS,
} from "@/lib/contracts/HarvestXTokenAbi";

// HarvestXToken is an 18-decimal ERC20. balance is used for the redeem flow
// (redeemHxForStablecoin accepts 18-decimal amounts at 1:1 with USDC).
export function useTokenBalance() {
  const { address } = useAccount();
  const enabled = !!address;

  const {
    data: balance = BigInt(0),
    isLoading,
    refetch,
  } = useReadContract({
    address: HARVEST_X_TOKEN_ADDRESS,
    abi: HARVEST_X_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  return {
    balance: balance as bigint,
    formatted: Number(formatUnits(balance as bigint, 18)),
    decimals: 18,
    isLoading,
    refetch,
  };
}
