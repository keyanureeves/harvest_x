"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  History,
  Leaf,
  Coins,
  Loader2,
  AlertCircle,
  Search,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Package,
} from "lucide-react";
import { useAccount, useConfig } from "wagmi";
import { formatEther } from "viem";
import {
  useFarmerData,
  useProductEvents,
  useWasteEvents,
} from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

const TOKEN = "HarvestX";

type FilterType = "all" | "waste" | "product";
type EventType = "waste" | "product";

interface CombinedEvent {
  id: string;
  type: EventType;
  kg: number;
  timestamp: number;
  workersInvolved: number;
  workersPaymentKES: number;
  tokensMinted: number;
  co2Saved?: number;
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
  "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

const formatKES = (value: number) => `KES ${value.toLocaleString()}`;

const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function HistoryPage() {
  const { isConnected: walletConnected, chainId, address } = useAccount();
  const wagmiConfig = useConfig();
  const chain = wagmiConfig.chains.find((c) => c.id === chainId);
  const explorerBaseUrl = chain?.blockExplorers?.default.url;
  const farmerData = useFarmerData();
  const wasteEvents = useWasteEvents();
  const productEvents = useProductEvents();

  // Diagnostic: surface query/address mismatch info
  console.log("[history] address:", address);
  console.log("[history] contract:", getContractAddress(chainId));
  console.log("[history] waste query status:", {
    isLoading: wasteEvents.isLoading,
    isError: wasteEvents.isError,
    error: wasteEvents.error?.message ?? null,
    events: wasteEvents.events.length,
  });
  console.log("[history] product query status:", {
    isLoading: productEvents.isLoading,
    isError: productEvents.isError,
    error: productEvents.error?.message ?? null,
    events: productEvents.events.length,
  });

  // Real page state
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isConnected = walletConnected;
  const isLoadingData =
    farmerData.isLoading || wasteEvents.isLoading || productEvents.isLoading;

  const eventQueryError =
    wasteEvents.error ?? productEvents.error ?? null;

  const handleRetry = () => {
    void wasteEvents.refetch();
    void productEvents.refetch();
  };

  const events: CombinedEvent[] = useMemo(() => {
    const waste: CombinedEvent[] = wasteEvents.events.map((e) => ({
      id: `${e.transactionHash}-${e.logIndex}`,
      type: "waste",
      kg: Number(e.kg),
      timestamp: Number(e.timestamp) * 1000,
      workersInvolved: Number(e.workersInvolved),
      workersPaymentKES: Number(e.workerPaymentKES),
      tokensMinted: Number(formatEther(e.tokensMinted)),
      co2Saved: Number(e.co2Saved) / 1e18 / 1000,
      transactionHash: e.transactionHash,
    }));

    const product: CombinedEvent[] = productEvents.events.map((e) => ({
      id: `${e.transactionHash}-${e.logIndex}`,
      type: "product",
      kg: Number(e.productKg),
      timestamp: Number(e.timestamp) * 1000,
      workersInvolved: 0,
      workersPaymentKES: 0,
      tokensMinted: Number(formatEther(e.tokensMinted)),
      transactionHash: e.transactionHash,
    }));

    return [...waste, ...product].sort((a, b) => b.timestamp - a.timestamp);
  }, [wasteEvents.events, productEvents.events]);

  const totalWasteCollections = events.filter((e) => e.type === "waste").length;
  const totalProductClaims = events.filter((e) => e.type === "product").length;
  const totalWasteKg = Number(farmerData.impact.wasteKg);
  const totalProductKg = Number(farmerData.impact.productKg);
  const totalCO2Kg = Number(farmerData.impact.co2Kg);
  const totalTokens = Number(formatEther(farmerData.impact.tokens));
  const totalWorkers = Number(farmerData.impact.workersPaid);
  const totalPayout = Number(farmerData.impact.totalPayoutKES);

  // Filter by type, then by search term against the tx hash or event label
  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === "all" || event.type === filter;
    const label = event.type === "waste" ? "waste processing" : "product claim";
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      label.includes(term) ||
      event.transactionHash.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

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
            Please connect your wallet to view your history
          </p>
        </div>
      </CenteredState>
    );
  } else if (isLoadingData) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      </CenteredState>
    );
  } else {
    body = (
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Activity History
          </h1>
          <p className="text-muted-foreground">
            Complete record of all your waste processing activities
          </p>
        </div>

        {/* Fetch error banner */}
        {eventQueryError && (
          <div className="neomorph-card p-4 rounded-xl bg-destructive/10 border border-destructive/40 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Failed to load activity events
                </p>
                <p className="text-xs text-muted-foreground break-all mt-1 font-mono">
                  {eventQueryError instanceof Error
                    ? eventQueryError.message
                    : String(eventQueryError)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-secondary transition-all duration-200 flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

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

        {/* Summary stats */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <History className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Collections
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalWasteCollections}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProductClaims} product claims
            </p>
          </div>

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
              {totalWasteKg.toFixed(2)} kg
            </p>
            <p className="text-xs text-muted-foreground mt-1">Processed</p>
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
              {totalProductKg.toFixed(2)} kg
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fertilizer created
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/15">
                <Coins className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Tokens
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {totalTokens.toFixed(2)} {TOKEN}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total earned</p>
          </div>
        </div>

        {/* Worker stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Workers Impact
              </h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalWorkers}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total workers paid
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
              {formatKES(totalPayout)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Paid to workers
            </p>
          </div>
        </div>

        {/* Filters + search */}
        <div className="neomorph-card p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                filter === "all"
                  ? primaryBtn
                  : "bg-secondary text-secondary-foreground neomorph-inset"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("waste")}
              className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                filter === "waste"
                  ? primaryBtn
                  : "bg-secondary text-secondary-foreground neomorph-inset"
              }`}
            >
              <Leaf className="w-5 h-5" />
              Waste ({totalWasteCollections})
            </button>
            <button
              onClick={() => setFilter("product")}
              className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                filter === "product"
                  ? primaryBtn
                  : "bg-secondary text-secondary-foreground neomorph-inset"
              }`}
            >
              <Package className="w-5 h-5" />
              Product ({totalProductClaims})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by activity type or transaction hash"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Activity Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="relative neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border hover:bg-secondary/20 transition-all duration-200"
                >
                  {index !== filteredEvents.length - 1 && (
                    <div className="absolute left-9 top-20 w-0.5 h-8 bg-border" />
                  )}

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {event.type === "product" ? (
                        <Package className="w-6 h-6 text-primary" />
                      ) : (
                        <Leaf className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {event.type === "waste"
                              ? "Waste Processing"
                              : "Product Claim"}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {formatTimestamp(event.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Amount
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {event.kg.toFixed(2)} kg
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Tokens Earned
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {event.tokensMinted.toFixed(2)} {TOKEN}
                          </p>
                        </div>
                        {event.co2Saved !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              CO₂ Saved
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {event.co2Saved.toFixed(2)} kg
                            </p>
                          </div>
                        )}
                        {event.type === "waste" && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Workers
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {event.workersInvolved}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Payment
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {formatKES(event.workersPaymentKES)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-border">
                        <a
                          href={`${explorerBaseUrl}/tx/${event.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-primary font-mono flex items-center gap-1"
                        >
                          Tx: {event.transactionHash.slice(0, 10)}...
                          {event.transactionHash.slice(-8)}
                          <span className="text-xs">↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">
                {events.length === 0
                  ? "No activity history yet"
                  : "No entries match your search"}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {events.length === 0
                  ? "Start processing waste to build your activity timeline"
                  : "Try a different filter or search term"}
              </p>
              {events.length === 0 && (
                <Link href="/process" className={`inline-block ${primaryBtn}`}>
                  Process Waste
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Environmental impact summary */}
        {events.length > 0 && (
          <div className="neomorph-card p-8 rounded-3xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Environmental Impact
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your total contribution to sustainability
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="neomorph-inset p-4 rounded-xl bg-background/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Waste Diverted
                </p>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {totalWasteKg.toFixed(2)} kg
                </p>
                <p className="text-xs text-primary">Prevented from landfill</p>
              </div>

              <div className="neomorph-inset p-4 rounded-xl bg-background/50">
                <p className="text-sm text-muted-foreground mb-2">CO₂ Offset</p>
                <p className="text-3xl font-bold text-primary mb-1">
                  {totalCO2Kg.toFixed(2)} kg
                </p>
                <p className="text-xs text-primary">Carbon emissions saved</p>
              </div>

              <div className="neomorph-inset p-4 rounded-xl bg-background/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Product Created
                </p>
                <p className="text-3xl font-bold text-secondary mb-1">
                  {totalProductKg.toFixed(2)} kg
                </p>
                <p className="text-xs text-secondary">
                  Organic fertilizer produced
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">{body}</div>
  );
}
