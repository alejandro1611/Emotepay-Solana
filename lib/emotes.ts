export const LAMPORTS_PER_SOL = 1_000_000_000n;

export type Emote = {
  id: string;
  onchainId: number;
  emoji: string;
  name: string;
  displayAmount: string;
  amountSol: string;
  lamports: bigint;
  color: string;
};

export const EMOTES = [
  {
    id: "fire",
    onchainId: 1,
    emoji: "🔥",
    name: "Hype Fire",
    displayAmount: "0.001 SOL",
    amountSol: "0.001",
    lamports: 1_000_000n,
    color: "from-orange-500 to-red-600",
  },
  {
    id: "rocket",
    onchainId: 2,
    emoji: "🚀",
    name: "To The Moon",
    displayAmount: "0.005 SOL",
    amountSol: "0.005",
    lamports: 5_000_000n,
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "crown",
    onchainId: 3,
    emoji: "👑",
    name: "King/Queen",
    displayAmount: "0.01 SOL",
    amountSol: "0.01",
    lamports: 10_000_000n,
    color: "from-amber-400 to-yellow-600",
  },
  {
    id: "gem",
    onchainId: 4,
    emoji: "💎",
    name: "Diamond Hands",
    displayAmount: "0.025 SOL",
    amountSol: "0.025",
    lamports: 25_000_000n,
    color: "from-cyan-400 to-blue-600",
  },
] as const satisfies readonly Emote[];
