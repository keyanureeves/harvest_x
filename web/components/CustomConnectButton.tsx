"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const base =
  "w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 neomorph-hover";

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className={`${base} bg-primary text-primary-foreground hover:bg-secondary`}
              >
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className={`${base} bg-red-600 text-white hover:bg-red-700`}
              >
                Wrong network
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={openChainModal}
                  className={`${base} bg-muted text-foreground flex items-center justify-center gap-2`}
                >
                  {chain.hasIcon && chain.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={chain.name ?? "Chain"}
                      src={chain.iconUrl}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  {chain.name}
                </button>
                <button
                  onClick={openAccountModal}
                  className={`${base} bg-muted text-foreground`}
                >
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ""}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
