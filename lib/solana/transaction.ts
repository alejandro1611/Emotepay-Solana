import {
  AccountRole,
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signature,
  type Address,
  type Instruction,
} from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";
import { solanaRpc } from "@/lib/solana/config";

const SYSTEM_PROGRAM_ADDRESS = address(
  "11111111111111111111111111111111",
);

// sha256("global:tip_sol")[0..8] = 6f5191ffebe5674b
const TIP_SOL_DISCRIMINATOR = [111, 81, 145, 255, 235, 229, 103, 75];

export function encodeTipSolInstructionData(
  amountLamports: bigint,
  emoteId: number,
): Uint8Array {
  const buffer = new ArrayBuffer(18);
  const view = new DataView(buffer);

  for (let i = 0; i < 8; i++) {
    view.setUint8(i, TIP_SOL_DISCRIMINATOR[i]);
  }

  // amount: u64 little-endian (8 bytes)
  view.setBigUint64(8, amountLamports, true);

  // emote_id: u16 little-endian (2 bytes)
  view.setUint16(16, emoteId, true);

  return new Uint8Array(buffer);
}

export function createTipSolInstruction({
  donor,
  creator,
  amountLamports,
  emoteId,
  programAddress,
}: {
  donor: Address;
  creator: Address;
  amountLamports: bigint;
  emoteId: number;
  programAddress: Address;
}): Instruction {
  return {
    programAddress,
    accounts: [
      { address: donor, role: AccountRole.WRITABLE_SIGNER },
      { address: creator, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    ],
    data: encodeTipSolInstructionData(amountLamports, emoteId),
  };
}

export type BuildTipTransactionParams = {
  donor: Address;
  creator: Address;
  amountLamports: bigint;
  emoteId: number;
  message?: string;
  programAddress: Address;
};

export type BuiltTipSolTransaction = {
  transactionBytes: Uint8Array;
  blockhash: string;
  lastValidBlockHeight: bigint;
};

export async function buildTipSolTransactionBytes({
  donor,
  creator,
  amountLamports,
  emoteId,
  message,
  programAddress,
}: BuildTipTransactionParams): Promise<BuiltTipSolTransaction> {
  const { value: latestBlockhash } = await solanaRpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();

  const tipInstruction = createTipSolInstruction({
    donor,
    creator,
    amountLamports,
    emoteId,
    programAddress,
  });

  const instructions: Instruction[] = [tipInstruction];

  const trimmedMessage = message?.trim();
  if (trimmedMessage) {
    const memoInstruction = getAddMemoInstruction({
      memo: trimmedMessage,
    });
    instructions.push(memoInstruction as unknown as Instruction);
  }

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (msg) => setTransactionMessageFeePayer(donor, msg),
    (msg) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
    (msg) => appendTransactionMessageInstructions(instructions, msg),
  );

  const compiledTransaction = compileTransaction(transactionMessage);
  return {
    transactionBytes: new Uint8Array(
      getTransactionEncoder().encode(compiledTransaction),
    ),
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  };
}

export function formatSolanaSignature(
  signatureInput: Uint8Array | string,
): string {
  if (typeof signatureInput === "string") {
    return signatureInput;
  }
  return getBase58Decoder().decode(signatureInput);
}

export type SolanaTransactionConfirmation =
  | { status: "confirmed" }
  | { status: "failed"; error: string }
  | { status: "expired"; error: string }
  | { status: "unknown"; reason: string };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function confirmSolanaTransaction(
  sigString: string,
  {
    lastValidBlockHeight,
    maxAttempts = 90,
    intervalMs = 1500,
  }: {
    lastValidBlockHeight: bigint;
    maxAttempts?: number;
    intervalMs?: number;
  },
): Promise<SolanaTransactionConfirmation> {
  let lastRpcError: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await solanaRpc
        .getSignatureStatuses([signature(sigString)], {
          searchTransactionHistory: true,
        })
        .send();

      const status = response.value?.[0];
      if (status?.err) {
        return {
          status: "failed",
          error: `Transaction failed on-chain: ${JSON.stringify(status.err)}`,
        };
      }
      if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized"
      ) {
        return { status: "confirmed" };
      }

      lastRpcError = null;
    } catch (err: unknown) {
      lastRpcError =
        err instanceof Error ? err.message : "RPC status check failed";
    }

    try {
      const currentBlockHeight = await solanaRpc
        .getBlockHeight({ commitment: "confirmed" })
        .send();

      if (currentBlockHeight > lastValidBlockHeight) {
        return {
          status: "expired",
          error:
            "The transaction blockhash expired before confirmation. The transaction should not land; check the signature before retrying.",
        };
      }
    } catch (err: unknown) {
      lastRpcError =
        err instanceof Error ? err.message : "RPC block-height check failed";
    }

    await sleep(intervalMs);
  }

  return {
    status: "unknown",
    reason: lastRpcError
      ? `Confirmation is still uncertain because the RPC did not return a final status: ${lastRpcError}`
      : "Confirmation is still pending before the blockhash expiration window was observed.",
  };
}
