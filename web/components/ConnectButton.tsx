"use client";

import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { emojiAvatarForAddress } from "@/lib/emojiAvatarForAddress";

export const ConnectBtn = () => {
  const { isConnecting, address, isConnected, chain } = useAccount();
  const { color: backgroundColor, emoji } = emojiAvatarForAddress(
    address ?? "",
  );

  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  if (!isConnected) {
    return (
      <button
        className="btn"
        onClick={openConnectModal}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect your wallet"}
      </button>
    );
  }

  if (isConnected && !chain) {
    return (
      <button className="btn" onClick={openChainModal}>
        Wrong network
      </button>
    );
  }

  return (
    <div className="max-w-5xl w-full flex items-center justify-between">
      <div
        className="flex justify-center items-center px-4 py-2 border border-neutral-700 bg-neutral-800/30 rounded-xl font-mono font-bold gap-x-2 cursor-pointer"
        onClick={() => openAccountModal?.()}
      >
        <div
          role="button"
          tabIndex={0}
          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor }}
        >
          {emoji}
        </div>
        <p>Account</p>
      </div>
      <button className="btn" onClick={openChainModal}>
        Switch Networks
      </button>
    </div>
  );
};
