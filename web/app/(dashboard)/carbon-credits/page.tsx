"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  TrendingUp,
  Loader2,
  AlertCircle,
  ShoppingCart,
  CheckCircle,
  Leaf,
  DollarSign,
  Info,
  Users,
  Globe,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useCarbonCredits, useRegister } from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

type ViewMode = "farmer" | "buyer";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

export default function CarbonCreditsPage() {
  const { chainId, isConnected: walletConnected } = useAccount();
  const register = useRegister();
  const credits = useCarbonCredits();

  const [viewMode, setViewMode] = useState<ViewMode>("farmer");
  const [buyForm, setBuyForm] = useState({ farmerAddress: "", tons: 0 });
  const [estimatedPrice, setEstimatedPrice] = useState<{
    priceUSD: bigint;
    priceUSDC: bigint;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isConnected = walletConnected;
  const isRegistered = register.isRegistered;
  const isLoadingData = register.isLoading || credits.isLoading;

  // Carbon credits are stored as hundredths of tons (e.g., 99 = 0.99 tons)
  const availableCredits = credits.carbonCredits
    ? Number(credits.carbonCredits.availableTons) / 100
    : 0;
  const totalEarned = credits.carbonCredits
    ? Number(credits.carbonCredits.totalEarnedTons) / 100
    : 0;
  const soldCredits = credits.carbonCredits
    ? Number(credits.carbonCredits.soldTons) / 100
    : 0;
  const estimatedValue = credits.carbonCredits
    ? Number(formatUnits(credits.carbonCredits.estimatedValueUSDC, 6))
    : 0;

  const oraclePricePerTon = credits.pricePerTonUSD || 100; // fallback $100/ton

  const pricePerTon =
    estimatedPrice && buyForm.tons > 0
      ? Number(estimatedPrice.priceUSD) / 1e8 / buyForm.tons
      : oraclePricePerTon;

  const updatePrice = async (tons: number) => {
    if (tons > 0) {
      const price = await credits.calculatePrice(tons);
      setEstimatedPrice(price);
    } else {
      setEstimatedPrice(null);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estimatedPrice) return;

    try {
      await credits.buyCarbonCredits({
        farmerAddress: buyForm.farmerAddress as `0x${string}`,
        tonsCO2: buyForm.tons,
        amountUSDC: Number(formatUnits(estimatedPrice.priceUSDC, 6)),
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error buying carbon credits:", err);
    }
  };

  const handlePurchaseMore = () => {
    setBuyForm({ farmerAddress: "", tons: 0 });
    setEstimatedPrice(null);
    setShowSuccess(false);
    void credits.refetch();
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
            Please connect your wallet to access carbon credits
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoadingData && viewMode === "farmer") {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading carbon credits...</p>
        </div>
      </CenteredState>
    );
  } else if (showSuccess && credits.isConfirmed) {
    body = (
      <CenteredState>
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border max-w-md">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Purchase Successful!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your carbon credits have been purchased and recorded on the
                blockchain
              </p>
              <div className="space-y-2 text-left bg-secondary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Credits:</span>{" "}
                  <span className="font-bold text-primary">
                    {buyForm.tons} tons CO₂
                  </span>
                </p>
                {estimatedPrice && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Total Cost:</span>{" "}
                    <span className="font-bold text-foreground">
                      $
                      {Number(
                        formatUnits(estimatedPrice.priceUSDC, 6),
                      ).toFixed(2)}{" "}
                      USDC
                    </span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handlePurchaseMore}
              className={`w-full ${primaryBtn}`}
            >
              Purchase More Credits
            </button>
          </div>
        </div>
      </CenteredState>
    );
  } else {
    body = (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Carbon Credits Marketplace
          </h1>
          <p className="text-muted-foreground">
            Buy and sell verified carbon offset credits
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
                  {chainId === 11155111
                    ? "Sepolia"
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

        {/* View mode toggle */}
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode("farmer")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              viewMode === "farmer"
                ? `${primaryBtn} shadow-lg`
                : "bg-secondary text-secondary-foreground neomorph-inset"
            }`}
          >
            <Leaf className="w-5 h-5 inline mr-2" />
            Farmer View
          </button>
          <button
            onClick={() => setViewMode("buyer")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              viewMode === "buyer"
                ? `${primaryBtn} shadow-lg`
                : "bg-secondary text-secondary-foreground neomorph-inset"
            }`}
          >
            <ShoppingCart className="w-5 h-5 inline mr-2" />
            Corporate Buyer
          </button>
        </div>

        {/* Farmer view */}
        {viewMode === "farmer" && (
          <>
            {!isRegistered && (
              <div className="neomorph-card p-6 rounded-3xl bg-accent/10 border border-accent/30">
                <div className="flex items-center gap-4 flex-wrap">
                  <AlertCircle className="w-10 h-10 text-accent flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Registration Required
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You need to register as a farmer to earn carbon credits
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className={`${primaryBtn} whitespace-nowrap`}
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Available
                  </h3>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {availableCredits.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">tons CO₂</p>
              </div>

              <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total Earned
                  </h3>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {totalEarned.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">tons CO₂</p>
              </div>

              <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/15">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Already Sold
                  </h3>
                </div>
                <p className="text-3xl font-bold text-accent">
                  {soldCredits.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">tons CO₂</p>
              </div>

              <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Est. Value
                  </h3>
                </div>
                <p className="text-3xl font-bold text-primary">
                  ${estimatedValue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">USDC</p>
              </div>
            </div>

            {/* How credits work */}
            <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-primary" />
                How Carbon Credits Work
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="neomorph-inset p-6 rounded-xl bg-secondary/10">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    Earning Credits
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    For every kilogram of organic waste you process, you save
                    400 grams of CO₂ emissions. These savings are converted into
                    carbon credits that you can sell to corporations.
                  </p>
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-semibold text-primary">
                      1 kg waste = 400g CO₂ saved = 0.0004 tons credit
                    </p>
                  </div>
                </div>

                <div className="neomorph-inset p-6 rounded-xl bg-secondary/10">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Selling Credits
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Corporations purchase your carbon credits to offset their
                    emissions. The price is set by the oracle at $
                    {pricePerTon.toFixed(2)} USD per ton.
                  </p>
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-semibold text-primary">
                      Current rate: ${pricePerTon.toFixed(2)} USD per ton
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Buyer view */}
        {viewMode === "buyer" && (
          <>
            <div className="neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Purchase Verified Carbon Credits
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Support local farmers while offsetting your carbon
                    footprint. All credits are verified on the blockchain and
                    represent real CO₂ savings from organic waste processing.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleBuy}
              className="neomorph-card p-8 rounded-3xl bg-card border border-border space-y-6"
            >
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Purchase Carbon Credits
              </h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Farmer Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={buyForm.farmerAddress}
                  onChange={(e) =>
                    setBuyForm({ ...buyForm, farmerAddress: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the wallet address of the farmer selling credits
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Tons of CO₂ to Purchase *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={buyForm.tons || ""}
                  onChange={(e) => {
                    const tons = Number(e.target.value);
                    setBuyForm({ ...buyForm, tons });
                    void updatePrice(tons);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
                  placeholder="0.00"
                />
              </div>

              {buyForm.tons > 0 && estimatedPrice && (
                <div className="neomorph-inset p-6 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-4">
                    Purchase Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        CO₂ Credits
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {buyForm.tons} tons
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Price per Ton
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        ${pricePerTon.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Platform Fee (2%)
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        ${(pricePerTon * buyForm.tons * 0.02).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between">
                      <span className="text-base font-semibold text-foreground">
                        Total Cost
                      </span>
                      <span className="text-xl font-bold text-primary">
                        $
                        {Number(
                          formatUnits(estimatedPrice.priceUSDC, 6),
                        ).toFixed(2)}{" "}
                        USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {(credits.approveError || credits.errorBuy) && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/40">
                  <p className="text-sm text-destructive break-all">
                    {(credits.approveError ?? credits.errorBuy)?.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  credits.isPending ||
                  credits.isConfirming ||
                  credits.isSwitching ||
                  credits.isApprovePending ||
                  credits.isApproveConfirming ||
                  buyForm.tons <= 0 ||
                  !buyForm.farmerAddress ||
                  !estimatedPrice
                }
                className={`w-full ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {credits.isSwitching ||
                credits.isApprovePending ||
                credits.isApproveConfirming ||
                credits.isPending ||
                credits.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {credits.isSwitching
                      ? "Switching Network..."
                      : credits.isApprovePending ||
                          credits.isApproveConfirming
                        ? "Approving USDC..."
                        : credits.isPending
                          ? "Confirm in Wallet..."
                          : "Processing Purchase..."}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Purchase Carbon Credits
                  </>
                )}
              </button>
            </form>

            <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Why Purchase Carbon Credits?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Offset Emissions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Neutralize your company&apos;s carbon footprint with
                    verified offsets
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    ESG Compliance
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Meet environmental, social, and governance reporting
                    requirements
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Support Farmers
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Directly support local farmers while promoting
                    sustainability
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return <div className="space-y-6">{body}</div>;
}