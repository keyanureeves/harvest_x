"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Leaf,
  Zap,
  TrendingUp,
  Loader2,
  AlertCircle,
  Users,
  Globe,
  Award,
  Recycle,
  type LucideIcon,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { useFarmerData, useGlobalStats, useRegister } from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

const TOKEN = "HarvestX";

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  iconWrap,
  iconColor,
  noteColor = "text-muted-foreground",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  iconWrap: string;
  iconColor: string;
  noteColor?: string;
}) {
  return (
    <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconWrap}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className={`text-xs mt-1 ${noteColor}`}>{note}</p>
    </div>
  );
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { address, isConnected: walletConnected, chainId } = useAccount();
  const farmerData = useFarmerData();
  const globalStats = useGlobalStats();
  const register = useRegister();

  const isConnected = walletConnected;
  const isRegistered = register.isRegistered;
  const isLoading = register.isLoading;

  const handleRegister = async () => {
    try {
      await register.register();
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const refetchFarmerImpact = farmerData.refetch;
  const refetchGlobalStats = globalStats.refetch;

  // Refetch farmer impact and global stats once a register tx confirms
  useEffect(() => {
    if (register.isConfirmed) {
      refetchFarmerImpact();
      refetchGlobalStats();
    }
  }, [register.isConfirmed, refetchFarmerImpact, refetchGlobalStats]);

  // Formatting: wasteKg / productKg / co2Kg are plain integers,
  // tokens use 18 decimals, USDC uses 6, credits are hundredths of a ton
  const wasteKg = Number(farmerData.impact.wasteKg);
  const productKg = Number(farmerData.impact.productKg);
  const co2Kg = Number(farmerData.impact.co2Kg);
  const tokens = Number(formatEther(farmerData.impact.tokens));
  const workersPaid = Number(farmerData.impact.workersPaid);
  const totalPayoutKES = Number(farmerData.impact.totalPayoutKES);
  const availableCredits =
    Number(farmerData.carbonCredits.available) / 100;
  const estimatedValue = Number(
    formatUnits(farmerData.carbonCredits.estimatedValueUSDC, 6),
  );
  const isVerified = farmerData.isVerified;

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
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoading) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </CenteredState>
    );
  } else if (!isRegistered) {
    body = (
      <CenteredState>
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border max-w-md">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Leaf className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to HarvestX!
              </h2>
              <p className="text-muted-foreground">
                Register as a farmer to start earning tokens for processing
                organic waste
              </p>
            </div>

            {register.isConfirmed && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <p className="text-sm text-primary font-medium">
                  Registration Successful!
                </p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={register.isPending || register.isConfirmed}
              className={`${primaryBtn} w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {register.isPending || register.isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registering...
                </>
              ) : register.isConfirmed ? (
                "Registration Confirmed! ✓"
              ) : (
                "Register as Farmer"
              )}
            </button>

            <p className="text-xs text-muted-foreground">
              By registering, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </CenteredState>
    );
  } else {
    body = (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here is your sustainability impact.
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

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            icon={Leaf}
            label="Waste Processed"
            value={`${wasteKg.toLocaleString()} kg`}
            note={`Product: ${productKg.toLocaleString()} kg`}
            iconWrap="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            icon={Zap}
            label="CO₂ Saved"
            value={`${co2Kg.toLocaleString()} kg`}
            note="Environmental impact verified ✓"
            iconWrap="bg-primary/10"
            iconColor="text-primary"
            noteColor="text-primary"
          />
          <StatCard
            icon={TrendingUp}
            label={`${TOKEN} Tokens`}
            value={`${tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${TOKEN}`}
            note={`≈ $${tokens.toFixed(2)} USD (placeholder price)`}
            iconWrap="bg-accent/15"
            iconColor="text-accent"
          />
          <StatCard
            icon={Users}
            label="Workers Paid"
            value={workersPaid.toString()}
            note={`Total: KES ${totalPayoutKES.toLocaleString()}`}
            iconWrap="bg-secondary/10"
            iconColor="text-secondary"
          />
        </div>

        {/* Carbon credits + status */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Available Carbon Credits
              </h3>
            </div>
            <p className="text-3xl font-bold text-primary">
              {availableCredits.toFixed(2)} tons
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Estimated value: ${estimatedValue.toFixed(2)} USDC
            </p>
            {availableCredits > 0 && (
              <Link
                href="/carbon-credits"
                className="mt-4 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-secondary transition-colors text-sm font-semibold"
              >
                Sell Credits →
              </Link>
            )}
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Recycle className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Farmer Status
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Registered
                </span>
                <span className="text-sm font-semibold text-primary">
                  ✓ Yes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <span
                  className={`text-sm font-semibold ${isVerified ? "text-primary" : "text-accent"}`}
                >
                  {isVerified ? "Yes" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Wallet</span>
                <span className="text-sm font-mono text-foreground">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "0xAbC1...9dEf"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global impact */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Global Impact
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Farmers",
                value: Number(globalStats.farmersCount).toLocaleString(),
              },
              {
                label: "Global Waste",
                value: `${Number(globalStats.wasteKg).toLocaleString()} kg`,
              },
              {
                label: "Global CO₂ Saved",
                value: `${Number(globalStats.co2SavedKg).toLocaleString()} kg`,
              },
              {
                label: "Carbon Credits Sold",
                value: `${(Number(globalStats.carbonCreditsSolTons) / 100).toFixed(2)} tons`,
              },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-sm text-muted-foreground mb-2">{s.label}</p>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="text-center space-y-4 py-8">
            <h2 className="text-2xl font-bold text-foreground">
              Quick Actions
            </h2>
            <p className="text-muted-foreground">
              Start processing waste or manage your carbon credits
            </p>
            <div className="flex gap-4 justify-center pt-4 flex-wrap">
              <Link href="/process" className={primaryBtn}>
                Process Waste
              </Link>
              <Link
                href="/carbon-credits"
                className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Carbon Credits
              </Link>
              <Link
                href="/balance"
                className="px-6 py-3 rounded-xl bg-muted text-foreground border border-border hover:bg-border transition-all duration-200 font-semibold"
              >
                View Balance
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{body}</div>
  );
}
