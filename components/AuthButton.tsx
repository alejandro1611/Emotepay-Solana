"use client";

import { useMemo, useState } from "react";
import { LogIn, LogOut, Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";

export function AuthButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useSolanaWallets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const solanaPublicKey = useMemo(() => wallets[0]?.address, [wallets]);
  const walletStatus = solanaPublicKey
    ? "Solana wallet ready"
    : "Solana wallet pending";

  if (!ready) {
    return (
      <button
        type="button"
        disabled
        className="text-sm font-medium px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 transition-all flex items-center gap-2"
      >
        Loading auth...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => login({ loginMethods: ["google", "email"] })}
        className="text-sm font-medium px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        Log in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-semibold text-emerald-300">
          Authenticated
        </span>
        <span className="text-[11px] text-slate-400">
          {walletsReady ? walletStatus : "Loading wallet..."}
        </span>
      </div>
      <div className="text-sm font-medium px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-purple-400" />
        <span className="max-w-[min(48vw,22rem)] overflow-x-auto whitespace-nowrap font-mono text-xs">
          {solanaPublicKey ?? "Wallet pending"}
        </span>
      </div>
      <button
        type="button"
        disabled={isLoggingOut}
        onClick={async () => {
          setIsLoggingOut(true);
          await logout();
          setIsLoggingOut(false);
        }}
        className="text-sm font-medium p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 disabled:opacity-60 transition-all"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
