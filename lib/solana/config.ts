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

export type EmotepayProgramConfig = {
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

export function validateRequiredSolanaPublicKey(
  configuredPublicKey?: string,
): EmotepayProgramConfig {
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

export const emotepayProgramConfig = validateRequiredSolanaPublicKey(
  process.env.NEXT_PUBLIC_EMOTEPAY_PROGRAM_ID,
);

export const emotepayProgramAddress = emotepayProgramConfig.publicKey;

export const demoSolanaCreator: SolanaCreatorConfig = {
  id: "demo-creator",
  displayName: "Demo Creator",
  ...validateSolanaPublicKey(process.env.NEXT_PUBLIC_CREATOR_SOLANA_ADDRESS),
};
