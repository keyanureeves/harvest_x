"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  DollarSign,
  Scale,
  Recycle,
  Info,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useFarmerData, useProcessWaste, useRegister } from "@/lib/hooks";

const TOKEN = "HarvestX";

type ProcessWasteInput = {
  collectedWasteKg: number;
  wasteType: string;
  workersInvolved: number;
  workersPaymentKES: number;
};

const EMPTY_FORM: ProcessWasteInput = {
  collectedWasteKg: 0,
  wasteType: "",
  workersInvolved: 0,
  workersPaymentKES: 0,
};

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

export default function ProcessWastePage() {
  const { isConnected: walletConnected, chainId } = useAccount();
  const register = useRegister();
  const farmerData = useFarmerData();
  const waste = useProcessWaste();

  const [formData, setFormData] = useState<ProcessWasteInput>(EMPTY_FORM);
  const [dismissedMessage, setDismissedMessage] = useState(false);

  const isConnected = walletConnected;
  const isRegistered = register.isRegistered;
  const isVerified = farmerData.isVerified;
  const showSuccess = waste.isConfirmed && !dismissedMessage;

  const calculateRewards = (kg: number) => ({
    tokens: Math.floor(kg / 10),
    co2: (kg * 0.4).toFixed(1), // 400g of CO2 per kg processed
  });

  const rewards = calculateRewards(formData.collectedWasteKg);

  const handleInputChange = (
    field: keyof ProcessWasteInput,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDismissedMessage(false);
      await waste.processWaste({
        collectedWasteKg: BigInt(formData.collectedWasteKg),
        wasteType: formData.wasteType,
        workersInvolved: BigInt(formData.workersInvolved),
        workersPaymentKES: BigInt(formData.workersPaymentKES),
      });
    } catch (err) {
      console.error("Process waste error:", err);
    }
  };

  const handleProcessMore = () => {
    setFormData(EMPTY_FORM);
    setDismissedMessage(true);
    farmerData.refetch();
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
            Please connect your wallet to process waste
          </p>
        </div>
      </CenteredState>
    );
  } else if (register.isLoading || (isConnected && isRegistered && isVerified === undefined)) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </CenteredState>
    );
  } else if (!isRegistered) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-accent mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Registration Required
          </h2>
          <p className="text-muted-foreground">
            You need to register as a farmer first
          </p>
          <Link href="/dashboard" className={`inline-block ${primaryBtn}`}>
            Go to Dashboard
          </Link>
        </div>
      </CenteredState>
    );
  } else if (!isVerified) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-accent mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Verification Pending
          </h2>
          <p className="text-muted-foreground">
            Your farmer account needs to be verified before processing waste
          </p>
          <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Verification ensures farmers follow proper waste processing
              guidelines. This process is handled by platform administrators.
            </p>
          </div>
        </div>
      </CenteredState>
    );
  } else if (showSuccess) {
    const submitted = calculateRewards(formData.collectedWasteKg);
    body = (
      <CenteredState>
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border max-w-md">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Waste Processed!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your waste collection has been successfully recorded
              </p>
              <div className="space-y-2 text-left bg-secondary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Tokens Earned:</span>{" "}
                  <span className="font-bold text-primary">
                    {submitted.tokens} {TOKEN}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">CO₂ Saved:</span>{" "}
                  <span className="font-bold text-primary">
                    {submitted.co2} kg
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Workers Paid:</span>{" "}
                  <span className="font-bold text-foreground">
                    {formData.workersInvolved} workers
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleProcessMore}
              className={`w-full ${primaryBtn}`}
            >
              Process More Waste
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
            Process Waste
          </h1>
          <p className="text-muted-foreground">
            Record your waste collection and earn {TOKEN} tokens
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
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="neomorph-card p-8 rounded-3xl bg-card border border-border space-y-6"
        >
          {/* Waste amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Waste Collected (kg) *
            </label>
            <input
              type="number"
              min="10"
              step="1"
              required
              value={formData.collectedWasteKg || ""}
              onChange={(e) =>
                handleInputChange("collectedWasteKg", Number(e.target.value))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
              placeholder="Enter weight in kg (minimum 10kg)"
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Minimum: 10 kg — you earn 1 {TOKEN} per 10kg
            </p>
          </div>

          {/* Waste type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Recycle className="w-4 h-4 text-primary" />
              Waste Type *
            </label>
            <select
              required
              value={formData.wasteType}
              onChange={(e) => handleInputChange("wasteType", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
            >
              <option value="">Select waste type</option>
              <option value="Food Waste">Food Waste</option>
              <option value="Garden Waste">Garden Waste</option>
              <option value="Agricultural Waste">Agricultural Waste</option>
              <option value="Mixed Organic">Mixed Organic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Workers involved */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              Workers Involved
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.workersInvolved || ""}
              onChange={(e) =>
                handleInputChange("workersInvolved", Number(e.target.value))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-secondary neomorph-inset"
              placeholder="Number of workers"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Track the number of workers involved in collection
            </p>
          </div>

          {/* Worker payment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              Total Payment (KES)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.workersPaymentKES || ""}
              onChange={(e) =>
                handleInputChange("workersPaymentKES", Number(e.target.value))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent neomorph-inset"
              placeholder="Total paid to workers"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter total amount paid to workers in KES
            </p>
          </div>

          {/* Rewards preview */}
          {formData.collectedWasteKg >= 10 && (
            <div className="neomorph-inset p-6 rounded-xl bg-primary/5 border border-primary/20">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" />
                Estimated Rewards
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {TOKEN} Tokens
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {rewards.tokens}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {TOKEN}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    CO₂ Saved
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {rewards.co2}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      kg
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              waste.isPending ||
              waste.isConfirming ||
              formData.collectedWasteKg < 10 ||
              !formData.wasteType ||
              formData.workersInvolved < 1 ||
              formData.workersPaymentKES < 1
            }
            className={`w-full ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {waste.isPending || waste.isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {waste.isPending ? "Confirm in Wallet..." : "Processing..."}
              </>
            ) : (
              <>
                <Leaf className="w-5 h-5" />
                Process Waste Collection
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
            * Required fields. Transaction will be recorded on the blockchain
            and cannot be reversed.
          </p>
        </form>

        {/* Info box */}
        <div className="neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border">
          <h4 className="font-semibold text-foreground mb-3">
            About Waste Processing
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Each 10kg of waste earns you 1 {TOKEN} token</p>
            <p>• Waste processing saves approximately 400g of CO₂ per kg</p>
            <p>• Verified farmers earn tokens that can be redeemed for USDC</p>
            <p>• Worker information helps track economic impact</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{body}</div>
  );
}
