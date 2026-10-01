# EmotePay Solana — Agent Instructions

## Project

EmotePay is a real-time tipping platform for streamers built on Solana.

Target product flow:

viewer
→ Privy authentication
→ Privy Solana embedded wallet
→ EmotePay Anchor program
→ creator receives SOL / USDC
→ TipEvent
→ realtime OBS overlay
→ creator analytics

This repository is the Solana version of EmotePay for the Superteam Argentina hackathon.

Do not introduce new Monad/EVM architecture into Solana functionality.

Legacy EVM files may temporarily remain in the repository as migration reference.
Do not remove them unless the current migration phase explicitly requires it.

---

## Current implementation status

Verified and complete:

- Privy email/Google authentication
- Privy Solana embedded wallet
- Solana public key displayed in the frontend
- Solana Devnet frontend configuration
- Anchor program workspace
- `tip_sol` instruction
- SOL transfer through the System Program
- `TipEvent`
- zero-tip rejection
- self-tip rejection
- invalid emote rejection
- local Anchor build
- local Anchor/LiteSVM tests

Not implemented yet:

- Anchor program deployment to Devnet
- frontend SOL transaction flow
- real Devnet tip from the Privy wallet
- Solana realtime OBS listener
- Solana creator history/indexing
- USDC tipping
- fee sponsorship
- AI runtime features

Never assume something in the "Not implemented yet" list already exists.

---

## Current verified stack

### Frontend

- Next.js 16
- React
- Framer Motion
- Privy
- Privy Solana embedded wallets

### Solana client

Current verified dependency:

- `@solana/kit 5.5.1`

Do not upgrade `@solana/kit` automatically.

The current version is verified with the installed Privy integration.

If a newer Kit version is required, first verify compatibility and propose a migration plan.

### Program

- Rust
- Anchor 1.1.2

### Toolchain

- rustc 1.98.1
- solana-cli 3.1.10
- anchor-cli 1.1.2
- avm 1.1.2

### Network

Target integration network:

- Solana Devnet

Local program tests must remain local unless a phase explicitly requires Devnet integration.

### EmotePay program ID

Current generated local program ID:

`EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL`

IMPORTANT:

This program ID has been generated and verified locally.

Do not assume it has been deployed to Devnet until the dedicated deployment phase is completed and verified.

Do not regenerate the program keypair or change the program ID without explicit approval.

---

## Instruction precedence and project-specific overrides

When instructions conflict, use this order:

1. The explicit task given by the user for the current phase.
2. Repository-specific constraints and verified state in `AGENTS.md`.
3. Current migration state documented in `docs/MIGRATION_STATUS.md`, when present.
4. Generic guidance in `SOLANA-RULES.md`.
5. Model memory.

`SOLANA-RULES.md` is an upstream/general best-practices baseline.

It does NOT authorize silently replacing already verified project dependencies, architecture, or tooling.

Canonical documentation and the Solana MCP should be used to verify current API facts.

Project decisions documented in `AGENTS.md` still take precedence over generic ecosystem recommendations.

---

## Current explicit overrides

### Solana Kit

Generic guidance may recommend `@solana/kit` v8+.

EmotePay currently uses:

`@solana/kit 5.5.1`

This version is verified with the installed Privy integration.

Do not upgrade it automatically.

If a future feature requires Kit 8+:

1. verify current Privy compatibility documentation
2. identify breaking API changes
3. explain why the upgrade is required
4. present a migration plan
5. wait for approval
6. migrate in an isolated phase
7. rerun authentication, wallet, build, and transaction tests

Do not upgrade Kit merely because a generic guide recommends a newer version.

### Testing

Program development tests are local by default.

Current verified flow:

```bash
cargo fmt --check
anchor build
anchor test
```

The existing Anchor/LiteSVM suite is the primary program regression suite.

Devnet testing is a separate integration/smoke phase after deployment.

Do not point the regular regression suite at Devnet merely because generic rules mention Devnet.

Do not treat `anchor test` as the end-to-end product test.

### RPC provider

RPC URLs must come from environment/configuration.

Do not assume Triton, Helius, or another paid RPC provider is already configured.

Current development may use a public Devnet RPC.

Before the final hackathon demo or production-like deployment, evaluate a reliable dedicated RPC provider.

Never place a secret RPC credential in a `NEXT_PUBLIC_*` variable.

If a provider requires a secret credential, use either:

- an appropriately restricted public/client credential, or
- a server-side/proxy architecture

Do not hardcode provider secrets.

### Fee sponsorship

Privy embedded Solana wallets are implemented.

Application-sponsored transaction fees are NOT implemented yet.

Do not assume the application is the fee payer until a dedicated fee-sponsorship phase has been implemented and tested.

### USDC

USDC tipping is part of the target architecture but is NOT implemented yet.

The currently verified program supports SOL tipping only.

Do not add SPL Token / USDC logic unless the current phase explicitly requests it.

---

## Solana MCP

For Solana-related work, prefer the Solana Developer MCP and canonical documentation over model memory for current technical facts.

For non-trivial Solana questions:

1. inspect the available Solana MCP documentation/search capabilities
2. retrieve relevant canonical documentation
3. use documentation search or expert-help capabilities when needed
4. verify APIs and version compatibility before implementation

Do not guess current Solana, Anchor, Kit, SPL Token, or RPC APIs when they can be verified through authoritative sources.

Whenever Solana program Rust is written or modified:

1. use the available Solana program autofix/review capability
2. inspect the suggested changes
3. apply only relevant fixes
4. run the review/autofix capability again
5. repeat until another pass is not required
6. run formatting, build, and tests

Never blindly apply generated fixes without understanding their impact on the current program version.

---

## Anchor rules

Use the Anchor version currently verified for this repository.

Current version:

`Anchor 1.1.2`

Do not silently upgrade Anchor.

If an Anchor upgrade becomes necessary:

1. explain why
2. verify Solana CLI compatibility
3. verify dependency compatibility
4. propose the migration
5. wait for approval
6. rerun the complete Anchor test suite

All accounts must use appropriate Anchor validation.

Use:

- `Signer` for authorization
- `Account` / `SystemAccount` for ownership and type validation
- constraints for account relationships
- canonical bumps for PDAs

Avoid:

- `unsafe`
- `unwrap()` in production code
- unchecked arithmetic
- unnecessary PDAs
- unnecessary onchain state
- unnecessary custody

Use checked arithmetic when arithmetic is required.

CPI targets must be verified.

The program should maintain the minimum possible onchain state.

---

## EmotePay program principles

Payments must be non-custodial.

The standard EmotePay payment path should be:

donor
→ EmotePay instruction
→ creator

EmotePay should not retain streamer funds unless a future feature explicitly requires escrow and that architecture is separately approved.

The current implemented instruction is:

`tip_sol`

The current payment rail is:

`SOL`

Future payment rails may include:

`USDC / SPL Token`

but they must be implemented in a dedicated phase.

Tip events are payment proofs/notifications, not payment storage.

Do not create donation-history accounts onchain.

History, analytics, messages, and stream metadata belong offchain.

---

## Transactions

Default integration network:

`Solana Devnet`

Never send Mainnet transactions unless explicitly requested by the user.

Before signing or sending a transaction:

1. validate recipient
2. validate amount
3. validate asset/token
4. validate cluster
5. validate program ID
6. simulate when appropriate
7. make clear what will be signed
8. send
9. confirm transaction

Never blindly retry a payment after a timeout.

Check the existing signature status first.

Avoid any flow that could accidentally double-pay.

Do not send transactions from the user's wallet merely to test unrelated code.

---

## Secrets and wallets

Never:

- request seed phrases
- print private keys
- print keypair JSON
- commit keypair files
- expose private keys in logs
- store private keys in `NEXT_PUBLIC_*` variables
- expose server secrets to the browser

Privy embedded-wallet private keys must never leave Privy.

Anchor/Solana program keypair files must remain ignored by Git.

Never use the user's Privy embedded wallet as a program deployment wallet.

Deployment wallets and user wallets are separate concerns.

Public keys, program IDs, and transaction signatures are public information and may be reported.

Private key material must never be displayed.

---

## Client generation

IDL-derived/generated Solana clients are preferred over manually maintained instruction encoders.

When connecting the frontend to the Anchor program:

1. build the Anchor program
2. use the generated IDL as the program interface source of truth
3. verify the recommended client/codegen path using the Solana MCP
4. check compatibility with the currently installed:
   - Privy version
   - `@solana/kit 5.5.1`
   - Anchor 1.1.2
5. explain any required client dependency changes
6. present a migration plan before introducing another client framework

Do not introduce Codama, Anchor TypeScript clients, `@solana/web3.js`, or another Solana client stack merely because generic ecosystem guidance recommends it.

If one of those tools is genuinely required, explain:

- why the existing stack cannot handle the requirement
- compatibility impact
- files affected
- migration risk

Preserve the currently verified stack unless the active phase requires a change.

---

## Realtime events and OBS

The current Solana OBS integration is NOT implemented yet.

When it is implemented:

- preserve the existing OBS animation queue and visual behavior where possible
- consume Solana program events rather than EVM events
- deduplicate events
- handle WebSocket disconnect/reconnect behavior
- avoid replaying historical tips as new live alerts
- filter events for the configured creator
- verify transaction/program origin before displaying an alert

Do not modify OBS during unrelated phases.

---

## History and analytics

Donation history and creator analytics belong offchain.

Do not create one onchain account per tip merely to support history.

The future Solana indexing layer should support:

- transaction signature
- donor public key
- creator public key
- amount
- asset
- emote ID
- timestamp / slot
- idempotent ingestion

The indexer/provider must be selected in a dedicated phase.

Do not assume the existing EVM Envio implementation is the final Solana indexing solution.

---

## Testing

Every Solana program change must pass locally:

```bash
cargo fmt --check
anchor build
anchor test
```

The current local Anchor/LiteSVM suite is the program regression test suite.

Devnet is used separately for:

- deployment verification
- real-wallet integration testing
- real transaction verification
- end-to-end smoke testing

Do not replace local regression tests with Devnet tests.

A Devnet deployment or smoke test must never happen implicitly as part of normal development.

Do not deploy if local tests fail.

For frontend changes, run the relevant project checks, including:

```bash
npm run lint
npx tsc --noEmit
```

Run the production build when the phase materially changes the frontend or dependency graph:

```bash
npx next build --webpack
```

Do not fix unrelated warnings or dependency vulnerabilities unless they block the current phase.

---

## AI feature boundary

AI must never decide whether money is transferred.

Payments must remain deterministic.

AI may be used for:

- donation message moderation
- sentiment classification
- emote recommendations
- animation recommendations
- creator analytics
- stream summaries
- highlight detection
- creator assistance

AI output must not change an already authorized payment amount or recipient.

Never place private chat content or personal user data onchain.

AI-generated or AI-analyzed user content should remain offchain.

---

## Scope discipline

Do not make unrelated refactors.

Do not upgrade dependencies unless required by the current phase.

Do not modify working modules outside the current task without explaining why.

Do not begin the next migration phase automatically.

For every phase:

1. audit the relevant existing implementation
2. verify current APIs when necessary
3. implement the smallest required scope
4. format/lint/build/test as appropriate
5. report files changed
6. report commands executed
7. report warnings or blockers
8. report any manual verification required
9. stop before beginning the next phase

If blocked by missing credentials, funding, wallet configuration, external services, or user approval:

STOP and report the exact requirement.

Do not work around security boundaries or invent credentials.

---

## Spec-Driven Development

EmotePay uses Spec-Driven Development for all meaningful features and migration phases.

The workflow is defined in:

`docs/SDD_WORKFLOW.md`

All new significant work must begin from an approved specification under:

`specs/`

Do not implement a meaningful new feature directly from an informal request if no specification exists.

Small typo fixes, formatting-only changes, and trivial non-behavioral corrections do not require a full specification.

## Agent orchestration

The primary Codex agent acts as the orchestrator.

For an SDD feature, the expected roles are:

1. Architect
2. Implementer
3. Reviewer
4. Human approval

Use the repo-scoped skills:

- `emotepay-architect`
- `emotepay-implementer`
- `emotepay-reviewer`

The orchestrator should delegate independent work to subagents when the current Codex environment exposes subagent capabilities.

### Architect

Must be read-only.

Reviews the spec before implementation.

### Implementer

May modify files.

Implements one approved spec only.

Prefer one write-capable implementer for a bounded feature.

### Reviewer

Must be independent from the implementer and read-only during review.

Reviews implementation against the spec.

### Human

The user is the final approval authority.

Agents cannot approve their own implementation.

## Multi-agent rules

Parallel subagents are appropriate for independent read-only work such as:

- documentation research
- API compatibility research
- security analysis
- test-plan analysis

Avoid multiple agents editing the same files concurrently.

For a normal EmotePay spec:

Architect
→ human spec approval
→ Implementer
→ Reviewer
→ human final approval

Do not skip stages unless the user explicitly requests it.

## Specification status

Allowed statuses:

- DRAFT
- REVIEW
- APPROVED
- IMPLEMENTING
- VERIFYING
- COMPLETE
- BLOCKED

Only the user may authorize transition from:

REVIEW → APPROVED

and:

VERIFYING → COMPLETE

## Spec change rule

An approved spec is immutable during implementation unless a required change is explicitly surfaced and approved.

If an approved requirement must change:

STOP.

Report the proposed spec change.

Wait for human approval.

Do not silently modify requirements to make implementation pass.