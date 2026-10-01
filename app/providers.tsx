"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import { solanaDevnetRpcs } from "@/lib/solana/config";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/overlay") && !privyAppId) {
    return <>{children}</>;
  }

  if (!privyAppId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not configured");
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#a855f7",
        },
        loginMethods: ["google", "email"],
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        solana: {
          rpcs: solanaDevnetRpcs,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
