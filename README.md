# EmotePay — Solana

**Real-time programmable tipping for streamers on Solana.**

EmotePay lets viewers support creators through gesture-based micropayments while triggering realtime animated reactions directly inside OBS.

This repository contains the **Solana-native version of EmotePay**, being developed for the **Superteam Argentina hackathon**.

> This repository is separate from the original Monad/EVM implementation of EmotePay.

---

## What is EmotePay?

Traditional donations interrupt the streaming experience.

EmotePay turns a payment into an interaction.

A viewer can select a reaction such as:

```text
🔥 Hype Fire
🚀 To The Moon
👑 King / Queen
💎 Diamond Hands
```

and send a micropayment to the streamer.

The target experience is:

```text
Viewer
  ↓
Email / Google login
  ↓
Privy Solana embedded wallet
  ↓
Select emote
  ↓
EmotePay Anchor program
  ↓
Creator receives SOL / USDC
  ↓
TipEvent
  ↓
Realtime OBS overlay
  ↓
Animated reaction appears on stream
```

No seed phrase is required for the normal viewer onboarding flow.

---

## Why Solana?

EmotePay is designed around frequent, low-value, realtime interactions.

Solana provides a strong foundation for that use case through:

- low transaction costs
- high throughput
- low-latency confirmation
- native programmable payments
- strong stablecoin ecosystem
- realtime RPC/event infrastructure

This makes it particularly suitable for creator micropayments and interactive streaming experiences.

---

# Current Project Status

EmotePay Solana is currently under active development.

## Completed

### Phase 1 — Privy Solana Wallet

- email / social authentication
- Privy Solana embedded wallet
- Solana Devnet configuration
- Base58 Solana public key displayed in the UI
- wallet readiness state
- frontend lint / TypeScript / production build validation

### Phase 2 — Anchor SOL Tipping MVP

Implemented:

```text
tip_sol(amount, emote_id)
```

Verified behavior:

- donor must sign
- amount must be greater than zero
- self-tipping is rejected
- invalid emote ID is rejected
- exact SOL amount is forwarded to creator
- program does not retain the tip
- `TipEvent` is emitted after successful transfer
- local Anchor tests pass
- Solana MCP program review is clean

Current generated Program ID:

```text
EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL
```

> The program ID is generated and verified locally.
> The program has **not yet been deployed to Solana Devnet**.

---

## Upcoming

The planned migration path is:

```text
Phase 3 — Devnet deployment
        ↓
Phase 4 — Privy wallet → real SOL tip
        ↓
Phase 5 — Solana TipEvent → OBS realtime overlay
        ↓
Phase 6 — Solana indexing / creator analytics
        ↓
Phase 7 — USDC tipping
        ↓
Phase 8 — fee sponsorship / gasless UX
        ↓
Phase 9 — AI-powered creator features
```

The roadmap may evolve through approved specifications.

---

# Architecture

```text
                         VIEWER
                           │
                           ▼
                  Email / Google Login
                           │
                           ▼
                         Privy
                           │
                           ▼
              Solana Embedded Wallet
                           │
                           ▼
                EmotePay Anchor Program
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
           Creator Payment        TipEvent
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
                 OBS Realtime               Indexing
                    Overlay                     │
                        │                       ▼
                        ▼               Creator Analytics
                 Live Animation
```

The standard payment path is intentionally non-custodial:

```text
donor
→ EmotePay instruction
→ creator
```

EmotePay does not require an onchain account for every donation.

Historical data, messages, analytics, and AI-generated metadata remain offchain.

---

# Tech Stack

## Frontend

- Next.js 16
- React
- Framer Motion
- Privy

## Solana

- Solana Devnet
- `@solana/kit 5.5.1`
- Rust
- Anchor 1.1.2

## Authentication

- Privy authentication
- Privy Solana embedded wallets

## Smart Program

Current instruction:

```text
tip_sol
```

Current event:

```text
TipEvent
```

Target future payment rails:

```text
SOL
USDC
```

USDC is **not implemented yet**.

---

# Anchor Program

Location:

```text
solana/emotepay-program/
```

Instruction:

```rust
tip_sol(
    ctx: Context<TipSol>,
    amount: u64,
    emote_id: u16,
)
```

Accounts:

```text
donor          mutable signer
creator        mutable system account
system_program Solana System Program
```

The program performs:

```text
validate
   ↓
System Program CPI
   ↓
transfer SOL
   ↓
emit TipEvent
```

No:

- escrow
- platform custody
- donation-history PDA
- per-tip storage account
- platform fee

is currently used.

---

# TipEvent

The current Anchor event contains:

```text
donor
creator
amount
emote_id
timestamp
```

This event will later power:

- realtime OBS reactions
- creator history
- analytics
- future AI-assisted stream insights

---

# Development Methodology

EmotePay uses **Spec-Driven Development (SDD)** with agent-assisted implementation.

Meaningful features begin with a versioned specification under:

```text
specs/
```

The development flow is:

```text
Specification
      ↓
Architecture Review
      ↓
Human Approval
      ↓
Implementation
      ↓
Independent Review
      ↓
Tests / Solana MCP Review
      ↓
Human Approval
      ↓
Complete
```

The repository contains three scoped Codex workflows:

```text
.codex/skills/
├── emotepay-architect
├── emotepay-implementer
└── emotepay-reviewer
```

The main agent acts as the orchestrator.

The human remains the final approval authority.

---

# AI-Assisted Development

The project uses specialized agent tooling for Solana development.

Current development environment includes:

- Codex
- repo-scoped agent instructions
- Solana development skill
- Solana Developer MCP
- Solana canonical documentation search
- Solana expert assistance
- Solana program review/autofix tooling

Repository context is defined through:

```text
AGENTS.md
SOLANA-RULES.md
docs/
specs/
.codex/skills/
```

This setup is intended to reduce outdated API usage and keep agent-generated Solana code constrained by verified project rules.

AI agents do **not** have authority to approve their own implementation.

---

# AI Product Direction

AI runtime functionality is not part of the current payment path.

Payments remain deterministic.

Possible future AI features include:

### AI Reaction Director

Analyze optional donation messages to determine:

- sentiment
- safe-to-display status
- reaction intensity
- recommended OBS animation

AI never changes the recipient or payment amount.

### Creator Stream Copilot

Use offchain stream/payment data to generate:

- stream summaries
- reaction highlights
- supporter insights
- suggested clip moments
- thank-you drafts

Private user content remains offchain.

---

# Repository Structure

```text
emotepay-solana/
│
├── app/
│   ├── page.tsx
│   ├── overlay/
│   └── creator/
│
├── components/
│
├── lib/
│   └── solana/
│
├── solana/
│   └── emotepay-program/
│
├── specs/
│   ├── README.md
│   ├── TEMPLATE.md
│   ├── 001-privy-solana-wallet.md
│   └── 002-anchor-tip-sol.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MIGRATION_STATUS.md
│   ├── SDD_WORKFLOW.md
│   └── AI_FEATURES.md
│
├── .codex/
│   └── skills/
│       ├── emotepay-architect/
│       ├── emotepay-implementer/
│       └── emotepay-reviewer/
│
├── AGENTS.md
├── SOLANA-RULES.md
└── README.md
```

Some legacy EVM files may temporarily remain while the Solana migration is in progress.

They are not the target architecture of this repository.

---

# Getting Started

## Requirements

Recommended verified toolchain:

```text
Node.js
npm

rustc 1.98.1
solana-cli 3.1.10
anchor-cli 1.1.2
avm 1.1.2
```

---

## Install frontend dependencies

```bash
npm install
```

---

## Environment

Create:

```text
.env.local
```

using:

```text
.env.example
```

Current public configuration includes:

```env
NEXT_PUBLIC_PRIVY_APP_ID=

NEXT_PUBLIC_SOLANA_RPC_URL=
NEXT_PUBLIC_SOLANA_WS_URL=

NEXT_PUBLIC_CREATOR_SOLANA_ADDRESS=
```

Never commit:

- seed phrases
- private keys
- deployer keypairs
- secret API tokens

---

## Run frontend

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

If Turbopack causes local performance issues, the project can also be started with Webpack:

```bash
npx next dev --webpack
```

---

# Frontend Validation

```bash
npm run lint
npx tsc --noEmit
npx next build --webpack
```

---

# Anchor Validation

Enter:

```bash
cd solana/emotepay-program
```

Then run:

```bash
cargo fmt --check
anchor build
anchor test
```

The current SOL tipping MVP passes the local Anchor test suite.

---

# Security Principles

EmotePay follows several core rules:

- non-custodial payments by default
- no seed phrase collection
- no private keys exposed to frontend code
- no deployer private keys in `NEXT_PUBLIC_*`
- no unnecessary onchain state
- no blind transaction retries
- explicit cluster validation
- explicit recipient and amount validation
- local tests before Devnet deployment
- independent review for Anchor changes
- human approval before deployment

---

# Specification-Driven Development

Specifications live under:

```text
specs/
```

Each meaningful feature uses requirement IDs such as:

```text
REQ-001
SEC-001
NFR-001
AC-001
```

Allowed lifecycle:

```text
DRAFT
→ REVIEW
→ APPROVED
→ IMPLEMENTING
→ VERIFYING
→ COMPLETE
```

Human approval is required before:

```text
REVIEW → APPROVED
```

and:

```text
VERIFYING → COMPLETE
```

See:

```text
docs/SDD_WORKFLOW.md
```

for the complete workflow.

---

# Current Specifications

```text
SPEC-001 — Privy Solana Embedded Wallet   COMPLETE
SPEC-002 — Anchor SOL Tipping Program     COMPLETE
```

The next specification will cover the first Solana Devnet deployment.

---

# Hackathon

This repository is being developed for the **Superteam Argentina** ecosystem/hackathon track.

The goal is to explore a Solana-native creator payment experience optimized for:

- realtime streaming
- low-value micropayments
- stablecoin payments
- frictionless onboarding
- programmable social interactions
- AI-assisted creator experiences

---

# Open Source

EmotePay is developed openly.

Architecture decisions, specifications, development rules, and agent workflows are intentionally versioned alongside the code to make the development process reproducible and auditable.

---

# License

See:

```text
LICENSE
```
