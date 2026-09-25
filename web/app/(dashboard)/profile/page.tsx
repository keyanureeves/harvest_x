"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Leaf,
  Zap,
  Coins,
  Users,
  DollarSign,
  Package,
  Award,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Calendar,
  MapPin,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { useFarmerData, useFarmerJoined } from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

const TOKEN = "HarvestX";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

export default function ProfilePage() {
  const { address, isConnected: walletConnected, chainId } = useAccount();
  const farmerData = useFarmerData();
  const farmerJoined = useFarmerJoined();

  const [copied, setCopied] = useState(false);

  const isConnected = walletConnected;
  const isLoadingData = farmerData.isLoading || farmerJoined.isLoading;
  const displayAddress = address ?? "";
  const isRegistered = farmerData.isRegistered;

  const copyAddress = () => {
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wasteKg = Number(farmerData.impact.wasteKg);
  const productKg = Number(farmerData.impact.productKg);
  const co2Kg = Number(farmerData.impact.co2Kg);
  const tokens = Number(formatEther(farmerData.impact.tokens));
  const workersPaid = Number(farmerData.impact.workersPaid);
  const totalPayoutKES = Number(farmerData.impact.totalPayoutKES);
  const totalWasteLifetimeKg = Number(farmerData.totalWasteKg);
  const totalCO2LifetimeKg = Number(farmerData.totalCO2Saved) / 1e18 / 1000;
  const carbonCredits = {
    availableTons: Number(farmerData.carbonCredits.available) / 100,
    totalEarnedTons: Number(farmerData.carbonCredits.totalEarned) / 100,
    soldTons: Number(farmerData.carbonCredits.sold) / 100,
    estimatedValueUSDC: Number(
      formatUnits(farmerData.carbonCredits.estimatedValueUSDC, 6),
    ),
  };

  /* ---------------------------- screen body ---------------------------- */

  let body: React.ReactNode;

  if (!isConnected) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your profile
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoadingData) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </CenteredState>
    );
  } else {
    body = (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Farmer Profile
          </h1>
          <p className="text-muted-foreground">
            Your complete impact and statistics
          </p>
        </div>

        {/* Network info (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="neomorph-inset p-4 rounded-xl bg-accent/10 border border-accent/30">
            <h3 className="text-sm font-semibold text-accent mb-2">
              🔧 Network info (dev only)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-muted-foreground">Chain ID:</span>
                <span className="text-foreground ml-2">{chainId ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>
                <span className="text-foreground ml-2">
                  {chainId === 1287
                    ? "Moonbase Alpha"
                    : chainId === 31337
                      ? "Foundry (local)"
                      : "Unknown"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Contract:</span>
                <span className="text-foreground ml-2 break-all">
                  {getContractAddress(chainId)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 neomorph-inset flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Farmer Account
                </h2>
                {isRegistered && (
                  <BadgeCheck className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {displayAddress}
                </p>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-secondary/20 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Copy wallet address"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Joined {farmerJoined.joinedAtMs ? new Date(farmerJoined.joinedAtMs).toLocaleDateString() : "—"}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Kenya
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">
                Member Status
              </p>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                  isRegistered
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted border-border"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRegistered
                      ? "bg-primary animate-pulse"
                      : "bg-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isRegistered ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isRegistered ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Waste
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {wasteKg.toFixed(2)} kg
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalWasteLifetimeKg.toFixed(2)} kg lifetime
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                CO₂ Saved
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {co2Kg.toFixed(2)} kg
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCO2LifetimeKg.toFixed(2)} kg lifetime
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/15">
                <Coins className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {TOKEN} Tokens
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {tokens.toFixed(2)} {TOKEN}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${tokens.toFixed(2)} USD (placeholder price)
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Package className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Product
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {productKg.toFixed(2)} kg
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fertilizer produced
            </p>
          </div>
        </div>

        {/* Worker & payment stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Workers Paid
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{workersPaid}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total workers employed
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/15">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Payout
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              KES {totalPayoutKES.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Amount paid to workers
            </p>
          </div>
        </div>

        {/* Carbon credits */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Carbon Credits
              </h3>
              <p className="text-sm text-muted-foreground">
                Your environmental impact credits
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available</p>
              <p className="text-3xl font-bold text-primary">
                {carbonCredits.availableTons.toFixed(2)} tons
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Earned</p>
              <p className="text-3xl font-bold text-foreground">
                {carbonCredits.totalEarnedTons.toFixed(2)} tons
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sold</p>
              <p className="text-3xl font-bold text-accent">
                {carbonCredits.soldTons.toFixed(2)} tons
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Est. Value</p>
              <p className="text-3xl font-bold text-primary">
                ${carbonCredits.estimatedValueUSDC.toFixed(2)}
              </p>
            </div>
          </div>

          {carbonCredits.availableTons > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                href="/carbon-credits"
                className={`inline-block ${primaryBtn}`}
              >
                Sell Carbon Credits →
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Quick Actions
          </h3>
          <div className="flex gap-4 flex-wrap">
            <Link href="/process" className={primaryBtn}>
              Process Waste
            </Link>
            <Link
              href="/carbon-credits"
              className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              View Marketplace
            </Link>
            <Link
              href="/balance"
              className="px-6 py-3 rounded-xl bg-muted text-foreground border border-border hover:bg-border transition-all duration-200 font-semibold"
            >
              Check Balance
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{body}</div>
  );
}
