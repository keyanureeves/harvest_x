"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Coins,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Leaf,
  Droplets,
  FlaskConical,
  Scale,
  Info,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAccount, useConfig } from "wagmi";
import {
  useClaimTokens,
  useFarmerData,
  useProductEvents,
  useRegister,
} from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

const TOKEN = "HarvestX";

const PRODUCT_TYPES = [
  {
    id: "compost",
    name: "Organic Compost",
    icon: Droplets,
    description: "Rich organic compost for farming",
  },
  {
    id: "fertilizer",
    name: "Liquid Fertilizer",
    icon: FlaskConical,
    description: "Concentrated liquid fertilizer",
  },
  {
    id: "biochar",
    name: "Biochar",
    icon: Leaf,
    description: "Carbon-rich soil amendment",
  },
] as const;

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function MintTokensPage() {
  const { isConnected: walletConnected, chainId } = useAccount();
  const wagmiConfig = useConfig();
  const chain = wagmiConfig.chains.find((c) => c.id === chainId);
  const explorerBaseUrl = chain?.blockExplorers?.default.url;

  const register = useRegister();
  const farmerData = useFarmerData();
  const productEvents = useProductEvents();
  const claim = useClaimTokens();

  const [amount, setAmount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string>(
    PRODUCT_TYPES[0].id,
  );
  const [dismissedMessage, setDismissedMessage] = useState(false);
  const [lastClaim, setLastClaim] = useState<{
    product: string;
    kg: number;
    tokens: number;
  } | null>(null);

  const isConnected = walletConnected;
  const isRegistered = register.isRegistered;
  const isLoadingData =
    register.isLoading ||
    (isConnected && isRegistered && farmerData.isLoading);

  const wasteKg = Number(farmerData.impact.wasteKg);
  const productKg = Number(farmerData.impact.productKg);
  const recentClaims = [...productEvents.events].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  const tokensToReceive = Math.floor(amount / 10);
  const showSuccess = claim.isConfirmed && !dismissedMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDismissedMessage(false);
    try {
      const productName =
        PRODUCT_TYPES.find((p) => p.id === selectedProduct)?.name ?? "";
      setLastClaim({
        product: productName,
        kg: amount,
        tokens: tokensToReceive,
      });
      await claim.claimProduct({ productKg: BigInt(amount) });
    } catch (err) {
      console.error("Claim tokens error:", err);
    }
  };

  const handleClaimMore = () => {
    setAmount(0);
    setDismissedMessage(true);
    void farmerData.refetch();
    void productEvents.refetch();
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
            Please connect your wallet to claim tokens
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoadingData) {
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
  } else if (showSuccess && lastClaim) {
    body = (
      <CenteredState>
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border max-w-md">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Tokens Claimed!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your product tokens have been successfully minted
              </p>
              <div className="space-y-2 text-left bg-secondary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Product:</span>{" "}
                  <span className="font-bold text-foreground">
                    {lastClaim.product}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-bold text-foreground">
                    {lastClaim.kg} kg
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Tokens Minted:</span>{" "}
                  <span className="font-bold text-primary">
                    {lastClaim.tokens} {TOKEN}
                  </span>
                </p>
              </div>
            </div>
            <button onClick={handleClaimMore} className={`w-full ${primaryBtn}`}>
              Claim More Tokens
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
            Mint Tokens
          </h1>
          <p className="text-muted-foreground">
            Claim tokens for your produced organic products
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

        {/* Current stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Waste Processed
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {wasteKg.toFixed(2)} kg
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Package className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Product Claimed
              </h3>
            </div>
            <p className="text-3xl font-bold text-secondary">
              {productKg.toFixed(2)} kg
            </p>
          </div>
        </div>

        {/* Product types */}
        <div className="grid md:grid-cols-3 gap-4">
          {PRODUCT_TYPES.map((product) => {
            const Icon = product.icon;
            const active = selectedProduct === product.id;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct(product.id)}
                className={`neomorph-card p-4 rounded-xl border transition-all duration-200 ${
                  active
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card border-border hover:bg-secondary/10"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                      active ? "bg-primary/20" : "bg-secondary/10"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info box */}
        <div className="neomorph-inset p-6 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How Product Claiming Works
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                After composting or processing your organic waste, you can claim
                tokens for the final product. For every 10kg of product, you
                will receive 1 {TOKEN} token.
              </p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <span>10 kg product = 1 {TOKEN}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>1 {TOKEN} ≈ $1 USD (placeholder price)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="neomorph-card p-8 rounded-3xl bg-card border border-border space-y-6"
        >
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Claim Your Tokens
          </h3>

          {/* Product amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Product Amount (kg) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
              placeholder="Enter product weight in kg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Weight of your produced compost, fertilizer, or other organic
              product
            </p>
          </div>

          {/* Tokens preview */}
          {amount > 0 && (
            <div className="neomorph-inset p-6 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Claim Summary
              </h4>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Product Amount
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {amount} kg
                  </p>
                </div>
                <div className="text-4xl text-muted-foreground">→</div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tokens to Receive
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {tokensToReceive} {TOKEN}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Rate: 1 {TOKEN} per 10 kg of product
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {claim.error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/40">
              <p className="text-sm text-destructive break-all">
                {claim.error.message}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              claim.isPending ||
              claim.isConfirming ||
              claim.isSwitching ||
              amount <= 0
            }
            className={`w-full ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {claim.isSwitching || claim.isPending || claim.isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {claim.isSwitching
                  ? "Switching Network..."
                  : claim.isPending
                    ? "Confirm in Wallet..."
                    : "Minting Tokens..."}
              </>
            ) : (
              <>
                <Coins className="w-5 h-5" />
                Claim {tokensToReceive} {TOKEN} Tokens
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
            * Transaction will be recorded on the blockchain. Make sure your
            product data is accurate.
          </p>
        </form>

        {/* Recent claims */}
        <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Claims
          </h3>
          {recentClaims.length > 0 ? (
            <div className="space-y-3">
              {recentClaims.slice(0, 5).map((event) => (
                <div
                  key={`${event.transactionHash}-${event.logIndex}`}
                  className="neomorph-inset p-4 rounded-xl bg-secondary/10"
                >
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTimestamp(Number(event.timestamp) * 1000)}
                      </p>
                      <p className="text-xl font-bold text-secondary mt-1">
                        {Number(event.productKg)} kg product
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Tokens Minted
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {Number(event.tokensMinted) / 1e18} {TOKEN}
                      </p>
                    </div>
                  </div>
                  {explorerBaseUrl && (
                    <a
                      href={`${explorerBaseUrl}/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:text-primary font-mono flex items-center gap-1 mt-2"
                    >
                      Tx: {event.transactionHash.slice(0, 10)}...
                      {event.transactionHash.slice(-8)}
                      <span className="text-xs">↗</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : productKg > 0 ? (
            <div className="neomorph-inset p-4 rounded-xl bg-secondary/10">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Product Claimed
                  </p>
                  <p className="text-2xl font-bold text-secondary">
                    {productKg.toFixed(2)} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tokens Earned</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.floor(productKg / 10)} {TOKEN}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent claims</p>
              <p className="text-sm">Your claimed tokens will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="space-y-6">{body}</div>;
}