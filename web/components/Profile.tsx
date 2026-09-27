"use client";

import { useAccount, useBalance, useEnsName } from "wagmi";
import { formatUnits } from "viem";
import { middleEllipsis } from "@/lib/utils";

const card =
  "rounded-lg border border-neutral-700 px-5 py-4 hover:bg-neutral-800/30 transition-colors";

export default function Profile() {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ens } = useEnsName({ address });

  return (
    <div className="grid gap-4 text-center lg:max-w-5xl lg:w-full lg:grid-cols-4 lg:text-left">
      <div className={card}>
        <h2 className="mb-3 text-2xl font-semibold">Wallet address</h2>
        <p className="text-sm opacity-50">
          {middleEllipsis(address ?? "", 12)}
        </p>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-2xl font-semibold">Network</h2>
        <p className="text-sm opacity-50">{chain?.name ?? ""}</p>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-2xl font-semibold">Balance</h2>
        <p className="text-sm opacity-50">
          {balance
            ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
            : ""}
        </p>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-2xl font-semibold">ENS name</h2>
        <p className="text-sm opacity-50">{ens ?? ""}</p>
      </div>
    </div>
  );
}
