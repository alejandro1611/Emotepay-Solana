# EmotePay Specifications

This directory contains the versioned specifications used by EmotePay's Spec-Driven Development workflow.

Each meaningful feature, migration phase, or architectural change should begin with a specification before implementation starts.

Specifications define what must be built. Implementation must satisfy the active approved specification. A specification must not be silently changed to match an implementation.

## Naming Convention

Specifications use this format:

```text
NNN-feature-name.md
```

Examples:

```text
001-privy-solana-wallet.md
002-anchor-tip-sol.md
003-devnet-deployment.md
```

`SPEC-003` is the first future prospective specification. It must not be created until the Devnet deployment phase begins.

## Canonical Lifecycle

The canonical lifecycle is:

```text
DRAFT
-> REVIEW
-> APPROVED
-> IMPLEMENTING
-> VERIFYING
-> COMPLETE
```

`BLOCKED` is supported when progress must stop for a human decision, missing credential, missing funding, unavailable external service, or approved requirement change.

## Human Approval Gates

Only the user may authorize:

```text
REVIEW -> APPROVED
```

and:

```text
VERIFYING -> COMPLETE
```

Agents may recommend approval, but they may not authorize these transitions.

## Required Traceability IDs

Specifications use stable IDs:

- `REQ-xxx` for functional requirements
- `SEC-xxx` for security requirements
- `NFR-xxx` for non-functional requirements
- `AC-xxx` for acceptance criteria

## Out of Scope

Every prospective specification must include an explicit `Out of Scope` section.

Out-of-scope items must not be implemented opportunistically. If an out-of-scope item becomes required, the implementer must stop and request human approval for a specification change.

## Specification Immutability

After a specification reaches `APPROVED`, it must not silently change during implementation.

If implementation reveals that an approved requirement must change:

```text
STOP
-> report affected requirement
-> explain problem
-> propose spec change
-> explain impact
-> wait for human approval
```

## Agent Workflow

The intended workflow is:

```text
Architect
-> Human approval
-> Implementer
-> Reviewer
-> Human approval
```

The architect is read-only and reviews the specification.

The implementer is write-capable and implements one approved specification only.

The reviewer is independent from the implementer and read-only during review.

The human remains the final approval authority.

## Reviewer Matrix

The reviewer must produce a final PASS / FAIL traceability matrix covering every:

- `REQ-xxx`
- `SEC-xxx`
- `NFR-xxx`
- `AC-xxx`

Example:

```text
REQ-001: PASS / FAIL
SEC-001: PASS / FAIL
NFR-001: PASS / FAIL
AC-001: PASS / FAIL
```

## Solana-Specific Validation

Solana specifications must preserve the verified project stack unless the spec explicitly requires a reviewed migration.

Current verified stack facts are defined in `AGENTS.md`, including:

- `@solana/kit 5.5.1`
- Anchor 1.1.2
- Solana Devnet as integration network
- local Anchor/LiteSVM tests as the program regression suite

For Anchor/Rust program changes, review must use the Solana Developer MCP program review capability when available.

Do not deploy, send transactions, or run airdrops unless the active approved specification explicitly requires it.

## Retrospective Specifications

Retrospective specifications document already completed and verified behavior.

They must clearly state that they were written after implementation and must not imply that they authorized the original work.

Current retrospective complete specs:

- `SPEC-001` / `001-privy-solana-wallet.md`: Privy Solana embedded wallet
- `SPEC-002` / `002-anchor-tip-sol.md`: Anchor SOL tipping program

Future prospective specs must follow this workflow before implementation starts.
