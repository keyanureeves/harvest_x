"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  DollarSign,
  Percent,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatUnits, isAddress, parseUnits } from "viem";
import {
  useAdminActions,
  useAdminGate,
  useFarmerLookup,
  usePlatformConfig,
} from "@/lib/hooks";
import { getContractAddress } from "@/lib/contracts/HarvestXAbi";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {children}
    </div>
  );
}

const primaryBtn =
  "px-6 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-secondary font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";
const dangerBtn =
  "px-6 py-4 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl";

export default function AdminPage() {
  const { address, chainId } = useAccount();
  const gate = useAdminGate();
  const platform = usePlatformConfig();
  const actions = useAdminActions();

  const isConnected = gate.isConnected;
  const isOwner = gate.isOwner;
  const displayAddress = address ?? "0x…";

  // Form inputs
  const [farmerToVerify, setFarmerToVerify] = useState("");
  const [farmerToRevoke, setFarmerToRevoke] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [checkedAddress, setCheckedAddress] = useState("");
  const lookup = useFarmerLookup(checkedAddress);
  const [newMinPrice, setNewMinPrice] = useState("");
  const [newFeePercentage, setNewFeePercentage] = useState("");
  const [newOracleAddress, setNewOracleAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const withdrawUSDC = (() => {
    if (!withdrawAmount) return BigInt(0);
    try {
      return parseUnits(withdrawAmount, 6);
    } catch {
      return BigInt(0);
    }
  })();

  const refetchPlatform = platform.refetch;

  // Refetch platform config whenever any admin write confirms
  useEffect(() => {
    if (
      actions.verify.isConfirmed ||
      actions.revoke.isConfirmed ||
      actions.minPrice.isConfirmed ||
      actions.fee.isConfirmed ||
      actions.oracle.isConfirmed ||
      actions.withdraw.isConfirmed
    ) {
      refetchPlatform();
    }
  }, [
    actions.verify.isConfirmed,
    actions.revoke.isConfirmed,
    actions.minPrice.isConfirmed,
    actions.fee.isConfirmed,
    actions.oracle.isConfirmed,
    actions.withdraw.isConfirmed,
    refetchPlatform,
  ]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerToVerify || !isAddress(farmerToVerify)) return;
    try {
      await actions.verifyFarmer(farmerToVerify as `0x${string}`);
      setFarmerToVerify("");
    } catch (err) {
      console.error("Verify error:", err);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerToRevoke || !isAddress(farmerToRevoke)) return;
    try {
      await actions.revokeVerification(farmerToRevoke as `0x${string}`);
      setFarmerToRevoke("");
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const handleSetMinPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinPrice) return;
    try {
      await actions.setMinPricePerTon(parseUnits(newMinPrice, 8));
      setNewMinPrice("");
    } catch (err) {
      console.error("Set min price error:", err);
    }
  };

  const handleSetFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeePercentage) return;
    try {
      await actions.setPlatformFee(BigInt(newFeePercentage));
      setNewFeePercentage("");
    } catch (err) {
      console.error("Set fee error:", err);
    }
  };

  const handleUpdateOracle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOracleAddress || !isAddress(newOracleAddress)) return;
    try {
      await actions.updateOracle(newOracleAddress as `0x${string}`);
      setNewOracleAddress("");
    } catch (err) {
      console.error("Update oracle error:", err);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawUSDC <= BigInt(0) || withdrawUSDC > platform.feePoolUSDC)
      return;
    try {
      await actions.withdrawFees(withdrawUSDC);
      setWithdrawAmount("");
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleCheck = () => {
    if (!checkAddress || !isAddress(checkAddress)) return;
    setCheckedAddress(checkAddress);
  };

  const minPriceUsd = Number(platform.minPricePerTon) / 1e8;
  const feeUsdc = Number(formatUnits(platform.feePoolUSDC, 6));

  const checkedResult = isAddress(checkedAddress)
    ? {
        registered: lookup.isRegistered,
        verified: lookup.isVerified ?? false,
      }
    : null;

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
            Please connect your wallet to access admin functions
          </p>
        </div>
      </CenteredState>
    );
  } else if (gate.isLoading) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </CenteredState>
    );
  } else if (!isOwner) {
    body = (
      <CenteredState>
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">
            Only the contract owner can access this page
          </p>
          <div className="mt-4 p-4 bg-secondary/10 rounded-lg text-left inline-block">
            <p className="text-xs text-muted-foreground">Current User:</p>
            <p className="text-xs font-mono text-foreground break-all">
              {displayAddress}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Contract Owner:
            </p>
            <p className="text-xs font-mono text-foreground break-all">
              {gate.owner ?? "Loading…"}
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
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage farmer verifications and platform settings
          </p>
        </div>

        {/* Debug info (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="neomorph-inset p-4 rounded-xl bg-accent/10 border border-accent/30">
            <h3 className="text-sm font-semibold text-accent mb-2">
              🔧 Debug info (dev only)
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
                    : chainId === 11155111
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

        {/* Owner badge */}
        <div className="neomorph-inset p-4 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Contract Owner</p>
              <p className="text-sm font-mono text-muted-foreground break-all">
                {displayAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Current platform settings */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Min Price/Ton</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${minPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Percent className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Platform Fee</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Number(platform.platformFeePercentage)}%
            </p>
          </div>

          <div className="neomorph-card p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Platform Fees</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {feeUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Withdrawable pool (HarvestX reserves:{" "}
              {Number(formatUnits(platform.tokenReserve, 18)).toFixed(2)} HX)
            </p>
          </div>
        </div>

        {/* Check farmer status */}
        <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-accent" />
            Check Farmer Status
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Farmer Wallet Address
              </label>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="0x... (checksummed address)"
                  value={checkAddress}
                  onChange={(e) => setCheckAddress(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
                />
                <button
                  onClick={handleCheck}
                  disabled={!checkAddress}
                  className={`${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Check
                </button>
              </div>
            </div>

            {checkedResult && (
              <div className="neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Registration Status
                    </p>
                    <div className="flex items-center gap-2">
                      {checkedResult.registered ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-primary">
                            Registered
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-red-500">
                            Not Registered
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Verification Status
                    </p>
                    <div className="flex items-center gap-2">
                      {checkedResult.verified ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-primary">
                            Verified ✓
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-accent" />
                          <span className="font-semibold text-accent">
                            Not Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Farmer management */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              Verify Farmer
            </h3>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Farmer Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={farmerToVerify}
                  onChange={(e) => setFarmerToVerify(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
                />
              </div>

              {actions.verify.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Farmer verified successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={actions.verify.isPending || !farmerToVerify || !isAddress(farmerToVerify)}
                className={`w-full ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {actions.verify.isPending || actions.verify.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Verify Farmer
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              Revoke Verification
            </h3>

            <form onSubmit={handleRevoke} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Farmer Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={farmerToRevoke}
                  onChange={(e) => setFarmerToRevoke(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500 neomorph-inset"
                />
              </div>

              {actions.revoke.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verification revoked successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={actions.revoke.isPending || !farmerToRevoke || !isAddress(farmerToRevoke)}
                className={`w-full ${dangerBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {actions.revoke.isPending || actions.revoke.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Revoke Verification
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Platform settings */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Set Minimum Price Per Ton
            </h3>

            <form onSubmit={handleSetMinPrice} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Price (USD) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="e.g., 1000"
                  value={newMinPrice}
                  onChange={(e) => setNewMinPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary neomorph-inset"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: ${minPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </p>
              </div>

              {actions.minPrice.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Minimum price updated successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={actions.minPrice.isPending || !newMinPrice}
                className={`w-full ${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {actions.minPrice.isPending || actions.minPrice.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Update Minimum Price
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Percent className="w-6 h-6 text-secondary" />
              Set Platform Fee
            </h3>

            <form onSubmit={handleSetFee} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fee Percentage (1-10%) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  step="1"
                  placeholder="e.g., 2"
                  value={newFeePercentage}
                  onChange={(e) => setNewFeePercentage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary neomorph-inset"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {Number(platform.platformFeePercentage)}%
                </p>
              </div>

              {actions.fee.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Platform fee updated successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={actions.fee.isPending || !newFeePercentage}
                className="w-full px-6 py-4 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actions.fee.isPending || actions.fee.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <Percent className="w-5 h-5" />
                    Update Platform Fee
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-accent" />
              Update Price Oracle
            </h3>

            <form onSubmit={handleUpdateOracle} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Oracle Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newOracleAddress}
                  onChange={(e) => setNewOracleAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent neomorph-inset"
                />
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  Current: {platform.oracleAddress ?? "Not set"}
                </p>
              </div>

              {actions.oracle.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Oracle updated successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={actions.oracle.isPending || !newOracleAddress || !isAddress(newOracleAddress)}
                className="w-full px-6 py-4 rounded-xl bg-accent text-white hover:opacity-90 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actions.oracle.isPending || actions.oracle.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Update Oracle
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="neomorph-card p-8 rounded-3xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-secondary" />
              Withdraw Platform Fees
            </h3>

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount (USDC) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 45.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary neomorph-inset"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {feeUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                </p>
              </div>

              {actions.withdraw.isConfirmed && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Fees withdrawn successfully!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  actions.withdraw.isPending ||
                  !withdrawAmount ||
                  withdrawUSDC <= BigInt(0) ||
                  withdrawUSDC > platform.feePoolUSDC
                }
                className="w-full px-6 py-4 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actions.withdraw.isPending || actions.withdraw.isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Withdraw Fees
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info box */}
        <div className="neomorph-inset p-6 rounded-xl bg-secondary/10 border border-border">
          <h4 className="font-semibold text-foreground mb-3">
            About Platform Management
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Only verified farmers can process waste and sell carbon credits
            </p>
            <p>
              • Minimum price ensures farmers get fair value for carbon credits
            </p>
            <p>• Platform fee is deducted from each carbon credit sale</p>
            <p>• Oracle provides real-time carbon credit pricing</p>
            <p>• Platform fees accumulate and can be withdrawn at any time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{body}</div>
  );
}
