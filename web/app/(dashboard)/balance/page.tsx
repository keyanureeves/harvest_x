"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  CheckCircle,
  Wallet,
  BarChart3,
  Globe,
  Droplet,
  Repeat,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAccount, useConfig } from "wagmi";
import { formatEther, formatUnits, parseUnits } from "viem";
import {
  useFarmerData,
  useTokenBalance,
  useUSDC,
  useRedeemTokens,
  useWasteEvents,
  useProductEvents,
  useRedeemEvents,
} from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

const TOKEN = "HarvestX";

type TxType = "earned" | "redeemed";

interface CombinedTx {
  id: string;
  type: TxType;
  amount: number;
  source: string;
  description: string;
  timestamp: number;
  transactionHash: string;
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

function timeAgo(ts: number) {
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days <= 0) return "today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function BalancePage() {
  const { isConnected: walletConnected, chainId } = useAccount();
  const wagmiConfig = useConfig();
  const chain = wagmiConfig.chains.find((c) => c.id === chainId);
  const explorerBaseUrl = chain?.blockExplorers?.default.url;
  const contractAddress = getContractAddress(chainId);

  const farmerData = useFarmerData();
  const tokenBalance = useTokenBalance();
  const usdc = useUSDC();
  const wasteEvents = useWasteEvents();
  const productEvents = useProductEvents();
  const redeemEvents = useRedeemEvents();

  const [copied, setCopied] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");

  // Parse the redeem input safely (18 decimals) for checkRedemptionStatus
  const hxAmount = (() => {
    try {
      return redeemAmount ? parseUnits(redeemAmount, 18) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  })();
  const redeem = useRedeemTokens(hxAmount);

  const isConnected = walletConnected;
  const isLoadingData = farmerData.isLoading || tokenBalance.isLoading;
  const isRegistered = farmerData.isRegistered;
  const isVerified = farmerData.isVerified ?? false;

  const owgBalance = tokenBalance.formatted;
  const usdcBalance = usdc.formatted;
  const usdValue = owgBalance; // 1 token = 1 USD placeholder price

  const wasteKg = Number(farmerData.impact.wasteKg);
  const productKg = Number(farmerData.impact.productKg);
  const totalWasteTokens = wasteKg / 10;
  const totalProductTokens = productKg / 10;
  const totalEarned = Number(formatEther(farmerData.impact.tokens));

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucet = async () => {
    try {
      await usdc.requestFaucet();
    } catch (err) {
      console.error("USDC faucet error:", err);
    }
  };

  const handleRedeem = async () => {
    try {
      await redeem.redeem();
    } catch (err) {
      console.error("Redeem error:", err);
    }
  };

  const maxRedeem = () => setRedeemAmount(formatUnits(tokenBalance.balance, 18));

  const transactions: CombinedTx[] = useMemo(() => {
    const waste: CombinedTx[] = wasteEvents.events.map((e) => ({
      id: `waste-${e.transactionHash}-${e.logIndex}`,
      type: "earned" as const,
      amount: Number(formatEther(e.tokensMinted)),
      source: "Waste Processing",
      description: `Organic waste - ${Number(e.kg)} kg`,
      timestamp: Number(e.timestamp) * 1000,
      transactionHash: e.transactionHash,
    }));

    const product: CombinedTx[] = productEvents.events.map((e) => ({
      id: `product-${e.transactionHash}-${e.logIndex}`,
      type: "earned" as const,
      amount: Number(formatEther(e.tokensMinted)),
      source: "Product Claim",
      description: `Organic product - ${Number(e.productKg)} kg`,
      timestamp: Number(e.timestamp) * 1000,
      transactionHash: e.transactionHash,
    }));

    const redeemed: CombinedTx[] = redeemEvents.events.map((e) => ({
      id: `redeem-${e.transactionHash}-${e.logIndex}`,
      type: "redeemed" as const,
      amount: Number(formatEther(e.owgAmount)),
      source: "Redeemed for USDC",
      description: `${Number(formatEther(e.owgAmount)).toFixed(2)} ${TOKEN} → ${Number(formatUnits(e.usdcAmount, 6)).toFixed(2)} USDC`,
      timestamp: e.timestamp,
      transactionHash: e.transactionHash,
    }));

    return [...waste, ...product, ...redeemed].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [wasteEvents.events, productEvents.events, redeemEvents.events]);

  const eventsLoading =
    wasteEvents.isLoading || productEvents.isLoading || redeemEvents.isLoading;

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
            Please connect your wallet to view your balance
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoadingData) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your balance...</p>
        </div>
      </CenteredState>
    );
  } else {
    body = (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Token Balance
          </h1>
          <p className="text-muted-foreground">
            View your {TOKEN} token balance, get test USDC, and redeem tokens
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
                  {contractAddress}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Balance card */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {TOKEN} Balance
              </p>
              <h2 className="text-5xl font-bold text-foreground mb-2">
                {owgBalance.toFixed(2)}{" "}
                <span className="text-3xl text-primary">{TOKEN}</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                ≈ ${usdValue.toFixed(2)} USD (placeholder price)
              </p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                From Waste Processing
              </p>
              <p className="text-2xl font-bold text-foreground">
                {totalWasteTokens.toFixed(2)} {TOKEN}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                From Product Claims
              </p>
              <p className="text-2xl font-bold text-foreground">
                {totalProductTokens.toFixed(2)} {TOKEN}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-primary">
                {totalEarned.toFixed(2)} {TOKEN}
              </p>
            </div>
          </div>
        </div>

        {/* USDC balance card */}
        <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Droplet className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">USDC Balance</p>
                <p className="text-2xl font-bold text-secondary">
                  {usdcBalance.toFixed(2)} USDC
                </p>
              </div>
            </div>
            <Link
              href="/carbon-credits"
              className={`${primaryBtn} flex items-center gap-2`}
            >
              Buy Credits
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* USDC faucet */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Droplet className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                USDC Faucet
              </h3>
              <p className="text-sm text-muted-foreground">
                Get test USDC tokens for purchasing carbon credits
              </p>
            </div>
          </div>

          <div className="neomorph-inset p-6 rounded-xl bg-secondary/10">
            <p className="text-sm text-muted-foreground mb-4">
              Claim 10,000 USDC instantly for testing
            </p>
            <button
              onClick={handleFaucet}
              disabled={
                usdc.isSwitching || usdc.isPending || usdc.isConfirming
              }
              className={`w-full ${primaryBtn} disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {usdc.isSwitching || usdc.isPending || usdc.isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {usdc.isSwitching
                    ? "Switching Network..."
                    : usdc.isPending
                      ? "Confirm in Wallet..."
                      : "Processing..."}
                </>
              ) : (
                <>
                  <Droplet className="w-4 h-4" />
                  Get 10,000 USDC
                </>
              )}
            </button>
          </div>

          {usdc.error && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/40">
              <p className="text-sm text-destructive break-all">
                {usdc.error.message}
              </p>
            </div>
          )}

          {usdc.isConfirmed && (
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-primary flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Successfully claimed USDC tokens!
              </p>
            </div>
          )}
        </div>

        {/* Redeem for USDC */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Repeat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Redeem {TOKEN} for USDC
              </h3>
              <p className="text-sm text-muted-foreground">
                Convert your {TOKEN} tokens to USDC at 1:1 ratio
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!isRegistered && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                <p className="text-sm text-accent flex items-center gap-2 flex-wrap">
                  <AlertCircle className="w-4 h-4" />
                  You must be registered to redeem tokens.{" "}
                  <Link href="/dashboard" className="underline">
                    Register now
                  </Link>
                </p>
              </div>
            )}
            {isRegistered && !isVerified && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                <p className="text-sm text-accent flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your account is pending verification. Please wait for admin
                  verification to redeem tokens.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-xl">
              <span className="text-sm text-muted-foreground">
                Available {TOKEN}:
              </span>
              <span className="text-xl font-bold text-foreground">
                {owgBalance.toFixed(2)} {TOKEN}
              </span>
            </div>

            <div className="neomorph-inset p-6 rounded-xl">
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount to Redeem ({TOKEN})
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="0"
                  max={owgBalance}
                  step="0.01"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!isVerified}
                  className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset disabled:opacity-50"
                />
                <button
                  onClick={maxRedeem}
                  disabled={!isVerified}
                  className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold neomorph-inset hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              </div>

              {redeemAmount && hxAmount > BigInt(0) && (
                <div className="mt-4 p-4 bg-primary/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      You will receive:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {Number(formatUnits(redeem.usdcAmount, 6)).toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                </div>
              )}

              {redeem.error && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/40">
                  <p className="text-sm text-destructive break-all">
                    {redeem.error.message}
                  </p>
                </div>
              )}

              {redeem.isConfirmed && (
                <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Successfully redeemed for USDC!
                  </p>
                </div>
              )}

              <button
                onClick={handleRedeem}
                disabled={
                  !isVerified ||
                  !redeem.canRedeem ||
                  redeem.isSwitching ||
                  redeem.isPending ||
                  redeem.isConfirming ||
                  hxAmount <= BigInt(0)
                }
                className={`w-full mt-4 ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {redeem.isSwitching ||
                redeem.isPending ||
                redeem.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {redeem.isSwitching
                      ? "Switching Network..."
                      : redeem.isPending
                        ? "Confirm in Wallet..."
                        : "Processing..."}
                  </>
                ) : !isVerified ? (
                  "Verification Required"
                ) : (
                  <>
                    <Repeat className="w-5 h-5" />
                    Redeem for USDC
                  </>
                )}
              </button>

              {isVerified && hxAmount > BigInt(0) && !redeem.canRedeem && (
                <p className="mt-3 text-xs text-accent flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {redeem.reason}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 p-4 bg-secondary/10 rounded-xl">
              <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                1 {TOKEN} = 1 USDC. Tokens are burned and USDC is sent to your
                wallet instantly. Make sure the contract has enough USDC balance
                for redemption. You must be registered and verified to redeem
                tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="neomorph-card p-6 rounded-3xl bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Transactions
          </h3>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading transactions...
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.type === "earned" ? "bg-primary/10" : "bg-accent/15"
                      }`}
                    >
                      {tx.type === "earned" ? (
                        <ArrowDownRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {tx.source}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description}
                      </p>
                      {explorerBaseUrl && (
                        <a
                          href={`${explorerBaseUrl}/tx/${tx.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-primary font-mono flex items-center gap-1"
                        >
                          View tx ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        tx.type === "earned" ? "text-primary" : "text-accent"
                      }`}
                    >
                      {tx.type === "earned" ? "+" : "-"}
                      {tx.amount.toFixed(2)} {TOKEN}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(tx.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">
                Your on-chain activity will appear here
              </p>
            </div>
          )}
          {(wasteEvents.isError ||
            productEvents.isError ||
            redeemEvents.isError) && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/40">
              <p className="text-sm text-destructive">
                Failed to load some transactions.{" "}
                <button
                  onClick={() => {
                    void wasteEvents.refetch();
                    void productEvents.refetch();
                    void redeemEvents.refetch();
                  }}
                  className="underline font-semibold"
                >
                  Retry
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Token info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-6 rounded-3xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Token Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Token Name
                </span>
                <span className="text-sm font-semibold text-foreground">
                  HarvestX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Symbol</span>
                <span className="text-sm font-semibold text-foreground">
                  {TOKEN}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Decimals</span>
                <span className="text-sm font-semibold text-foreground">
                  18
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-semibold text-foreground">
                  {chainId === 11155111
                    ? "Sepolia"
                    : chainId === 31337
                      ? "Foundry (local)"
                      : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="neomorph-card p-6 rounded-3xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Earning Rate
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Waste Processing
                </span>
                <span className="text-sm font-semibold text-primary">
                  1 {TOKEN} per 10 kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Product Claiming
                </span>
                <span className="text-sm font-semibold text-primary">
                  1 {TOKEN} per 10 kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  CO₂ per kg
                </span>
                <span className="text-sm font-semibold text-primary">
                  400 grams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract address */}
        <div className="neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">
                Contract Address
              </p>
              <p className="text-sm font-mono text-foreground break-all">
                {contractAddress}
              </p>
            </div>
            <button
              onClick={copyAddress}
              className={`${primaryBtn} flex items-center gap-2`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="space-y-6">{body}</div>;
}