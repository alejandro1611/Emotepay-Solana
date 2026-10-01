# SPEC-002 — Anchor SOL Tipping Program

## Status

COMPLETE

## Documentation Note

This specification was documented retrospectively after the implementation had already been completed, tested, and independently reviewed.

It records only behavior that has been verified in the current EmotePay Solana implementation.

It must not be interpreted as evidence that this specification existed before the implementation.

---

## Goal

Implement the minimal non-custodial EmotePay onchain payment primitive on Solana.

A donor must be able to send a SOL tip to a creator through the EmotePay Anchor program while emitting a structured event that can later be consumed by the realtime OBS overlay and offchain analytics systems.

---

## Context

The original EmotePay implementation used a Solidity contract on Monad.

The Solana version replaces that payment primitive with an Anchor program.

This specification covers only the first Solana-native onchain payment rail:

`SOL`

USDC and other SPL Token payment rails are intentionally outside the scope of this specification.

---

## Current Target Flow

```text
donor
  ↓
tip_sol(amount, emote_id)
  ↓
EmotePay Anchor program
  ↓
System Program CPI
  ↓
creator receives SOL
  ↓
TipEvent emitted
```

The program must not custody or retain the tip.

---

## Program

Workspace:

```text
solana/emotepay-program/
```

Program ID:

```text
EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL
```

This Program ID has been generated and verified locally.

At the completion of this specification, the program has NOT yet been deployed to Solana Devnet.

Devnet deployment belongs to a later specification.

---

## Instruction

```rust
tip_sol(
    ctx: Context<TipSol>,
    amount: u64,
    emote_id: u16,
)
```

---

## Accounts

### donor

```rust
#[account(mut)]
pub donor: Signer<'info>
```

Responsibilities:

- must sign the transaction
- provides the SOL being tipped
- must be different from the creator

### creator

```rust
#[account(mut)]
pub creator: SystemAccount<'info>
```

Responsibilities:

- receives the full SOL tip
- must be a valid system-owned account
- must be different from the donor

### system_program

```rust
pub system_program: Program<'info, System>
```

Responsibilities:

- executes the native SOL transfer
- must resolve to the canonical Solana System Program

---

## Functional Requirements

### REQ-001 — Successful SOL tip

Given a valid donor, creator, amount, and emote ID, the program MUST allow the donor to send a SOL tip to the creator.

### REQ-002 — Exact transfer

The creator MUST receive exactly the requested `amount` in lamports.

### REQ-003 — Non-custodial payment

The EmotePay program MUST NOT retain any portion of the tip.

The payment path must remain:

```text
donor
→ EmotePay instruction
→ creator
```

### REQ-004 — Positive amount

`amount` MUST be greater than zero.

A zero-value tip MUST fail.

### REQ-005 — No self-tipping

The donor MUST NOT be able to tip their own public key.

### REQ-006 — Valid emote identifier

`emote_id` MUST be greater than zero.

### REQ-007 — System Program transfer

The SOL transfer MUST occur through the Solana System Program using Anchor's CPI mechanism.

### REQ-008 — Event emission

After a successful transfer, the program MUST emit a `TipEvent`.

### REQ-009 — Event ordering

`TipEvent` MUST only be emitted after the SOL transfer succeeds.

A failed transfer MUST NOT produce a successful tip event.

---

## TipEvent

The event contains:

```rust
TipEvent {
    donor: Pubkey,
    creator: Pubkey,
    amount: u64,
    emote_id: u16,
    timestamp: i64,
}
```

### Event fields

`donor`

Public key of the wallet that sent the tip.

`creator`

Public key of the creator receiving the tip.

`amount`

Tip amount in lamports.

`emote_id`

Stable identifier for the selected EmotePay reaction.

`timestamp`

Unix timestamp retrieved from the Solana Clock sysvar.

---

## Security Requirements

### SEC-001 — Signer authorization

The donor MUST be represented by an Anchor `Signer`.

### SEC-002 — Creator validation

The creator MUST be represented by `SystemAccount`.

### SEC-003 — Self-tip protection

The program MUST explicitly reject:

```text
donor == creator
```

### SEC-004 — Zero-value protection

The program MUST reject:

```text
amount == 0
```

### SEC-005 — Invalid emote protection

The program MUST reject:

```text
emote_id == 0
```

### SEC-006 — Verified CPI target

The SOL transfer MUST use the verified System Program.

### SEC-007 — No custody

The program MUST NOT create a vault, escrow, donation balance, or other account that retains tip funds.

### SEC-008 — No unnecessary persistent state

The initial SOL tipping primitive MUST NOT create:

- donation-history PDAs
- per-tip accounts
- creator balance accounts
- unnecessary configuration accounts

History and analytics belong offchain.

---

## Non-Functional Requirements

### NFR-001 — Minimal program state

The instruction should require only the accounts necessary to perform the SOL transfer and emit the event.

### NFR-002 — Anchor compatibility

The implementation MUST remain compatible with the repository's verified Anchor version:

```text
Anchor 1.1.2
```

### NFR-003 — Deterministic payment behavior

Payment execution MUST NOT depend on:

- AI output
- external APIs
- offchain databases
- price feeds
- OBS state

### NFR-004 — Local testability

The program MUST be buildable and testable locally without Devnet funds.

---

## Custom Errors

The implementation includes explicit errors corresponding to:

```text
ZeroTip
SelfTipNotAllowed
InvalidEmote
```

---

## Out of Scope

This specification does NOT include:

- Devnet deployment
- frontend transaction integration
- Privy transaction signing
- realtime Solana OBS listener
- historical indexing
- creator analytics migration
- USDC tipping
- SPL Token transfers
- fee sponsorship
- escrow
- platform fees
- PDAs for donation history
- Mainnet deployment
- AI runtime features

---

## Acceptance Criteria

### AC-001 — Successful transfer

Given:

- a funded local donor
- a valid creator
- a positive amount
- a valid emote ID

When `tip_sol` executes,

Then the transaction succeeds.

### AC-002 — Exact creator balance change

The creator's balance increases by exactly the requested tip amount.

### AC-003 — No program custody

The EmotePay program does not retain the transferred lamports.

### AC-004 — Correct donor event field

`TipEvent.donor` equals the donor public key.

### AC-005 — Correct creator event field

`TipEvent.creator` equals the creator public key.

### AC-006 — Correct amount event field

`TipEvent.amount` equals the requested tip amount.

### AC-007 — Correct emote event field

`TipEvent.emote_id` equals the requested emote ID.

### AC-008 — Zero tip rejected

Calling `tip_sol` with:

```text
amount = 0
```

fails.

### AC-009 — Self-tip rejected

Calling `tip_sol` where:

```text
donor == creator
```

fails.

### AC-010 — Invalid emote rejected

Calling `tip_sol` with:

```text
emote_id = 0
```

fails.

---

## Automated Validation

The verified local validation flow is:

```bash
cargo fmt --check
anchor build
anchor test
```

Results at completion:

```text
cargo fmt --check   PASS
anchor build        PASS
anchor test         PASS
```

The test suite includes:

- successful SOL tip
- exact creator balance increase
- unchanged program lamports
- TipEvent donor assertion
- TipEvent creator assertion
- TipEvent amount assertion
- TipEvent emote ID assertion
- zero-tip rejection
- self-tip rejection
- invalid-emote rejection

---

## Solana MCP Review

The program was independently reviewed using the Solana Developer MCP `program_autofixer` capability.

Result:

```text
PROGRAM REVIEW CLEAN
```

Detected framework:

```text
Anchor
```

Findings:

```text
None
```

Another autofixer pass required:

```text
false
```

The review verified:

- Anchor account validation
- signer requirements
- System Program CPI safety
- self-tip prevention
- zero-tip prevention
- invalid-emote prevention
- transfer-before-event ordering
- absence of unnecessary state
- arithmetic safety
- Program ID consistency
- account ownership/rent assumptions
- Anchor 1.1.2 compatibility

---

## Manual Verification

No real-wallet manual transaction was required for this specification.

Real Devnet transaction verification belongs to a later specification.

---

## Rollback / Failure Behavior

If the local program fails to:

- compile
- pass tests
- preserve exact payment semantics
- pass Solana program review

it MUST NOT proceed to Devnet deployment.

No fallback implementation may silently bypass the Anchor program.

---

## Dependencies

Requires:

- Rust toolchain
- Solana CLI
- Anchor CLI
- LiteSVM/local Anchor testing environment

Verified versions:

```text
rustc       1.98.1
solana-cli  3.1.10
anchor-cli  1.1.2
avm         1.1.2
```

---

## Final Verification

### Functional Requirements

- REQ-001: PASS
- REQ-002: PASS
- REQ-003: PASS
- REQ-004: PASS
- REQ-005: PASS
- REQ-006: PASS
- REQ-007: PASS
- REQ-008: PASS
- REQ-009: PASS

### Security Requirements

- SEC-001: PASS
- SEC-002: PASS
- SEC-003: PASS
- SEC-004: PASS
- SEC-005: PASS
- SEC-006: PASS
- SEC-007: PASS
- SEC-008: PASS

### Non-Functional Requirements

- NFR-001: PASS
- NFR-002: PASS
- NFR-003: PASS
- NFR-004: PASS

### Acceptance Criteria

- AC-001: PASS
- AC-002: PASS
- AC-003: PASS
- AC-004: PASS
- AC-005: PASS
- AC-006: PASS
- AC-007: PASS
- AC-008: PASS
- AC-009: PASS
- AC-010: PASS

---

## Completion

Specification status:

```text
COMPLETE
```

Implementation was completed and verified before this specification was documented.

This document serves as the retrospective SDD record for the verified Anchor SOL tipping MVP.