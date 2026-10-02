"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
  Tv,
  Zap,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignAndSendTransaction,
  useWallets as useSolanaWallets,
} from "@privy-io/react-auth/solana";
import { address } from "@solana/kit";
import { AuthButton } from "@/components/AuthButton";
import {
  demoSolanaCreator,
  emotepayProgramAddress,
  emotepayProgramConfig,
  solanaDevnetChain,
} from "@/lib/solana/config";
import { EMOTES, type Emote } from "@/lib/emotes";
import { getSolanaExplorerUrl, type PaymentState } from "@/lib/payment";
import {
  buildTipSolTransactionBytes,
  confirmSolanaTransaction,
  formatSolanaSignature,
} from "@/lib/solana/transaction";

type SolanaWalletReadinessState =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "error"; reason: string };

function getSolanaWalletReadinessState({
  authReady,
  authenticated,
  walletsReady,
  hasSolanaWallet,
  hasSolanaPublicKey,
}: {
  authReady: boolean;
  authenticated: boolean;
  walletsReady: boolean;
  hasSolanaWallet: boolean;
  hasSolanaPublicKey: boolean;
}): SolanaWalletReadinessState {
  if (!authReady || !authenticated || !walletsReady) {
    return { status: "idle" };
  }

  if (!hasSolanaWallet) {
    return {
      status: "error",
      reason: "Solana embedded wallet is still being created.",
    };
  }

  if (!hasSolanaPublicKey) {
    return {
      status: "error",
      reason: "Solana public key is unavailable.",
    };
  }

  return { status: "ready" };
}

function getCreatorConfigurationWarning() {
  if (demoSolanaCreator.configurationStatus === "missing") {
    return "Creator Solana public key is not configured.";
  }

  if (demoSolanaCreator.configurationStatus === "invalid") {
    return "Creator Solana public key is invalid.";
  }

  return null;
}

function getProgramConfigurationWarning() {
  if (emotepayProgramConfig.configurationStatus === "missing") {
    return "EmotePay Devnet program ID is not configured. Set NEXT_PUBLIC_EMOTEPAY_PROGRAM_ID to a deployed program address.";
  }

  if (emotepayProgramConfig.configurationStatus === "invalid") {
    return "EmotePay Devnet program ID is invalid. Check NEXT_PUBLIC_EMOTEPAY_PROGRAM_ID.";
  }

  return null;
}

export default function Home() {
  const { ready, authenticated } = usePrivy();
  const { ready: walletsReady, wallets } = useSolanaWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [selectedEmote, setSelectedEmote] = useState<Emote>(EMOTES[0]);
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState<
    Array<{ id: number; emote: Emote; message: string }>
  >([]);
  const [transactionState, setTransactionState] = useState<PaymentState>({
    status: "idle",
  });
  const solanaWallet = useMemo(() => wallets[0], [wallets]);
  const solanaPublicKey = solanaWallet?.address;
  const isSelfDonation =
    Boolean(solanaPublicKey && demoSolanaCreator.publicKey) &&
    solanaPublicKey === demoSolanaCreator.publicKey;
  const readinessState = getSolanaWalletReadinessState({
    authReady: ready,
    authenticated,
    walletsReady,
    hasSolanaWallet: Boolean(solanaWallet),
    hasSolanaPublicKey: Boolean(solanaPublicKey),
  });
  const solanaWalletReady =
    readinessState.status === "ready" && !isSelfDonation;
  const creatorConfigurationWarning = getCreatorConfigurationWarning();
  const programConfigurationWarning = getProgramConfigurationWarning();

  const isProcessing =
    transactionState.status === "signing" ||
    transactionState.status === "confirming";
  const transactionLocked = isProcessing || transactionState.status === "pending";

  const canSendReaction =
    authenticated &&
    solanaWalletReady &&
    !isSelfDonation &&
    Boolean(demoSolanaCreator.publicKey) &&
    Boolean(emotepayProgramAddress) &&
    !transactionLocked;

  const sendButtonLabel = useMemo(() => {
    if (!authenticated) return "Log in to send reaction";
    if (!walletsReady || !solanaWallet) return "Preparing Solana wallet...";
    if (isSelfDonation) return "Cannot tip yourself";
    if (!demoSolanaCreator.publicKey) return "Creator not configured";
    if (!emotepayProgramAddress) return "Program not configured";
    if (transactionState.status === "signing") return "Confirm in your wallet...";
    if (transactionState.status === "confirming") return "Confirming on Devnet...";
    if (transactionState.status === "pending") return "Check transaction status";
    return `Send ${selectedEmote.displayAmount} Reaction`;
  }, [
    authenticated,
    walletsReady,
    solanaWallet,
    isSelfDonation,
    transactionState.status,
    selectedEmote.displayAmount,
  ]);

  const handleSendReaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !canSendReaction ||
      !solanaWallet ||
      !solanaPublicKey ||
      !demoSolanaCreator.publicKey ||
      !emotepayProgramAddress
    ) {
      return;
    }

    try {
      setTransactionState({ status: "signing" });

      const builtTransaction = await buildTipSolTransactionBytes({
        donor: address(solanaPublicKey),
        creator: demoSolanaCreator.publicKey,
        programAddress: emotepayProgramAddress,
        amountLamports: selectedEmote.lamports,
        emoteId: selectedEmote.onchainId,
        message: message.trim() || undefined,
      });

      const res = await signAndSendTransaction({
        transaction: builtTransaction.transactionBytes,
        wallet: solanaWallet,
        chain: solanaDevnetChain,
      });

      const signature = formatSolanaSignature(res.signature);
      const explorerUrl = getSolanaExplorerUrl(signature, "devnet");
      setTransactionState({ status: "confirming", signature });

      const confirmation = await confirmSolanaTransaction(signature, {
        lastValidBlockHeight: builtTransaction.lastValidBlockHeight,
      });
      if (confirmation.status === "failed" || confirmation.status === "expired") {
        setTransactionState({
          status: "error",
          reason: confirmation.error,
          signature,
          explorerUrl,
        });
        return;
      }

      if (confirmation.status === "unknown") {
        setTransactionState({
          status: "pending",
          signature,
          explorerUrl,
          reason: confirmation.reason,
        });
        return;
      }

      setTransactionState({
        status: "success",
        signature,
        explorerUrl,
      });

      // Local preview only. TODO: /overlay still uses the old EVM/Envio flow
      // and must be migrated to consume Solana TipEvent before real OBS alerts.
      const alertId = Date.now();
      setAlerts((prev) => [
        ...prev,
        {
          id: alertId,
          emote: selectedEmote,
          message: message.trim() || selectedEmote.name,
        },
      ]);
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }, 4500);

      setMessage("");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Transaction was rejected or failed.";
      setTransactionState({
        status: "error",
        reason: errorMsg,
      });
    }
  };


  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 backdrop-blur-md bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Emote<span className="text-purple-400">Pay</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Solana Devnet
            </button>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Stream Simulator & Overlay (Left Column - 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" /> Local Stream Preview
            </h2>
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20">
              Preview only
            </span>
          </div>

          {/* Stream Video Screen Mockup */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Stream Background Mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 flex flex-col items-center justify-center text-slate-600">
              <Tv className="w-16 h-16 stroke-[1] mb-2 opacity-40" />
              <p className="text-sm">Live Stream Gameplay Preview</p>
            </div>

            {/* Local preview animation; this is not wired to the real /overlay OBS page yet. */}
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute z-20 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/90 border border-purple-500/40 backdrop-blur-xl shadow-2xl shadow-purple-500/30 max-w-xs"
                >
                  <motion.span
                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-6xl mb-2"
                  >
                    {alert.emote.emoji}
                  </motion.span>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                    {alert.emote.name} ({alert.emote.displayAmount})
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    &quot;{alert.message}&quot;
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Viewer Reaction Panel (Right Column - 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Send Reaction Gesture
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Support the streamer instantly with zero crypto friction.
            </p>

            <form onSubmit={handleSendReaction} className="flex flex-col gap-5">
              {/* Emote Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                  1. Select your Gesture Emote
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {EMOTES.map((e) => {
                    const isSelected = selectedEmote.id === e.id;
                    return (
                      <button
                        type="button"
                        key={e.id}
                        onClick={() => setSelectedEmote(e)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${
                          isSelected
                            ? "bg-purple-600/15 border-purple-500 shadow-lg shadow-purple-500/10"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-2xl">{e.emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{e.name}</div>
                          <div className="text-[11px] font-medium text-purple-400">{e.displayAmount}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  2. Add a Message (Optional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¡Tremenda jugada bro!"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!canSendReaction}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r ${selectedEmote.color} hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}{" "}
                {sendButtonLabel}
              </button>

              {/* Status Feedback Banners */}
              {!authenticated && (
                <p className="text-xs text-slate-500 text-center">
                  Sign in with Google or email to create your Solana embedded wallet.
                </p>
              )}

              {authenticated && isSelfDonation && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>You cannot tip your own wallet address.</span>
                </div>
              )}

              {authenticated && creatorConfigurationWarning && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{creatorConfigurationWarning}</span>
                </div>
              )}

              {authenticated && programConfigurationWarning && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{programConfigurationWarning}</span>
                </div>
              )}

              {transactionState.status === "pending" && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Transaction status unknown</span>
                  </div>
                  <p className="text-slate-300">
                    {transactionState.reason} Do not send another tip until you
                    check this signature.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono break-all">
                    Sig: {transactionState.signature}
                  </p>
                  {transactionState.explorerUrl && (
                    <a
                      href={transactionState.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 mt-1"
                    >
                      Check on Solana Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {transactionState.status === "error" && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 break-all">
                    <p className="font-semibold mb-0.5">Donation failed</p>
                    <p className="text-red-300/80">{transactionState.reason}</p>
                    {transactionState.signature && (
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        Sig: {transactionState.signature.slice(0, 12)}...
                        {transactionState.signature.slice(-12)}
                      </p>
                    )}
                    {transactionState.explorerUrl && (
                      <a
                        href={transactionState.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 mt-2"
                      >
                        View on Solana Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {transactionState.status === "success" && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                  <div className="flex items-center gap-2 font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Donation confirmed on Solana Devnet!</span>
                  </div>
                  <p className="text-slate-300">
                    Sent <span className="font-bold text-white">{selectedEmote.displayAmount}</span> with gesture{" "}
                    <span>{selectedEmote.emoji}</span>
                  </p>
                  {transactionState.signature && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Sig: {transactionState.signature.slice(0, 12)}...{transactionState.signature.slice(-12)}
                    </p>
                  )}
                  {transactionState.explorerUrl && (
                    <a
                      href={transactionState.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 mt-1"
                    >
                      View on Solana Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
