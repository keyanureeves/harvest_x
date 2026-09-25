"use client";

import type React from "react";
import { AlertCircle, CheckCircle2, Leaf, Loader2, Plug } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRegister } from "@/lib/hooks";

const btnClass =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full";

function GateShell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="neomorph-card p-10 rounded-3xl bg-card border border-border max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground">{body}</p>
          </div>

          <div className="space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function RegisterGate({ children }: { children: React.ReactNode }) {
  const { openConnectModal } = useConnectModal();
  const {
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
  } = useRegister();

  // Not connected: initiate MetaMask connect
  if (!isConnected) {
    return (
      <GateShell
        icon={<Plug className="w-10 h-10 text-primary" />}
        title="Connect your wallet"
        body="Connect your wallet to access the HarvestX dashboard and register as a farmer."
      >
        <button onClick={openConnectModal} className={btnClass}>
          Connect wallet
        </button>
      </GateShell>
    );
  }

  // Wrong network: prompt switch to Sepolia
  if (needsNetworkSwitch) {
    return (
      <GateShell
        icon={<AlertCircle className="w-10 h-10 text-red-500" />}
        title="Wrong network"
        body="HarvestX smart contracts are deployed on Sepolia. Switch to Sepolia to continue."
      >
        <button
          onClick={switchToSepolia}
          disabled={isSwitching}
          className={btnClass}
        >
          {isSwitching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Switching...
            </>
          ) : (
            "Switch to Sepolia"
          )}
        </button>
      </GateShell>
    );
  }

  // Reading registration status
  if (isLoading && !isRegistered) {
    return (
      <GateShell
        icon={<Loader2 className="w-10 h-10 text-primary animate-spin" />}
        title="Loading..."
        body="Checking your farmer status on-chain."
      />
    );
  }

  // Registered: allow dashboard access
  if (isRegistered) {
    return <>{children}</>;
  }

  // Registered farmer? No -> gate on the register action
  return (
    <GateShell
      icon={<Leaf className="w-10 h-10 text-primary" />}
      title="Register as a farmer"
      body="Register on-chain to start earning tokens for processing organic waste."
    >
      {isConfirmed && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm text-primary font-medium">
            Registration Successful!
          </p>
        </div>
      )}

      <button
        onClick={register}
        disabled={isPending || isConfirming}
        className={btnClass}
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Confirm in wallet...
          </>
        ) : isConfirming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Waiting for confirmation...
          </>
        ) : (
          "Register as Farmer"
        )}
      </button>

      {error && (
        <p className="text-sm text-red-500 font-medium">{error.message}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Registering will open MetaMask to confirm the transaction on Sepolia.
      </p>
    </GateShell>
  );
}
