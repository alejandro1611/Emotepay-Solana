import {
  address,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  isAddress,
  type Address,
} from "@solana/kit";

export type SolanaPublicKeyConfigurationStatus =
  | "ready"
  | "missing"
  | "invalid";

export type SolanaCreatorConfig = {
  id: string;
  displayName: string;
  publicKey: Address | null;
  configurationStatus: SolanaPublicKeyConfigurationStatus;
};

export const solanaDevnetChain = "solana:devnet";

export const solanaRpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  "https://api.devnet.solana.com";

export const solanaWsUrl =
  process.env.NEXT_PUBLIC_SOLANA_WS_URL?.trim() ||
  "wss://api.devnet.solana.com";

export const solanaDevnetExplorerUrl =
  "https://explorer.solana.com/?cluster=devnet";

export const defaultEmotepayProgramId =
  "EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL";

export const emotepayProgramAddress: Address = address(
  process.env.NEXT_PUBLIC_EMOTEPAY_PROGRAM_ID?.trim() ||
    defaultEmotepayProgramId,
);

export const solanaRpc = createSolanaRpc(solanaRpcUrl);

export const solanaDevnetRpcs = {
  [solanaDevnetChain]: {
    rpc: solanaRpc,
    rpcSubscriptions: createSolanaRpcSubscriptions(solanaWsUrl),
    blockExplorerUrl: solanaDevnetExplorerUrl,
  },
};


export function validateSolanaPublicKey(
  configuredPublicKey?: string,
): Pick<SolanaCreatorConfig, "publicKey" | "configurationStatus"> {
  const trimmedPublicKey = configuredPublicKey?.trim();

  if (!trimmedPublicKey) {
    return {
      publicKey: null,
      configurationStatus: "missing",
    };
  }

  if (!isAddress(trimmedPublicKey)) {
    return {
      publicKey: null,
      configurationStatus: "invalid",
    };
  }

  return {
    publicKey: address(trimmedPublicKey),
    configurationStatus: "ready",
  };
}

export const demoSolanaCreator: SolanaCreatorConfig = {
  id: "demo-creator",
  displayName: "Demo Creator",
  ...validateSolanaPublicKey(process.env.NEXT_PUBLIC_CREATOR_SOLANA_ADDRESS),
};
