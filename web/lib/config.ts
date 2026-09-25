import { http, createStorage, cookieStorage } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "HarvestX",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [sepolia],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [sepolia.id]: http("https://sepolia.gateway.tenderly.co"),
  },
});
