import { useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { HARVEST_X_ABI, getContractAddress } from "@/lib/contracts/HarvestXAbi";

// farmers(address) returns the FarmerData struct as a tuple:
// [isRegistered, totalWasteKg, totalCO2Saved, totalProductKg, totalWorkersPaid, totalPayoutKES]
type FarmerTuple = [boolean, ...unknown[]];

export function useRegister() {
  const { address, chainId, isConnected } = useAccount();
  const contractAddress = getContractAddress(chainId);
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const {
    data: farmerData,
    isLoading,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: HARVEST_X_ABI,
    functionName: "farmers",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const isRegistered = farmerData
    ? (farmerData as unknown as FarmerTuple)[0]
    : false;

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const needsNetworkSwitch = isConnected && chainId !== sepolia.id;

  // Refetch farmer data after the tx is confirmed so isRegistered flips
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  const switchToSepolia = async () => {
    await switchChainAsync({ chainId: sepolia.id });
  };

  const register = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Switch to Sepolia first if needed (prompts MetaMask)
    if (chainId !== sepolia.id) {
      await switchChainAsync({ chainId: sepolia.id });
    }

    // Re-evaluate contract address after potential chain switch
    const resolvedAddress = getContractAddress(sepolia.id);

    console.log("Registering with contract:", resolvedAddress);
    console.log("Chain ID:", sepolia.id);

    try {
      await writeContract({
        address: resolvedAddress,
        abi: HARVEST_X_ABI,
        functionName: "register",
        args: [],
      });
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    }
  };

  return {
    isConnected,
    isRegistered,
    isLoading,
    needsNetworkSwitch,
    isSwitching,
    switchToSepolia,
    register,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    refetch,
  };
}
