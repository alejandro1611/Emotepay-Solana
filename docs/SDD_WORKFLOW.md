# EmotePay Spec-Driven Development Workflow

## Principle

Every meaningful feature or migration phase begins with a versioned specification.

Implementation must satisfy the specification.
The specification must not be silently rewritten to match the implementation.

## Source of Truth

For an active feature, authority is:

1. explicit user instruction
2. active specification under `specs/`
3. `AGENTS.md`
4. `docs/MIGRATION_STATUS.md`
5. `SOLANA-RULES.md`
6. canonical documentation / Solana MCP for current API facts

## Canonical Lifecycle

A specification moves through these states:

```text
DRAFT
-> REVIEW
-> APPROVED
-> IMPLEMENTING
-> VERIFYING
-> COMPLETE
```

`BLOCKED` is also supported when progress cannot continue without a human decision, missing credential, missing funding, unavailable external service, or approved requirement change.

## State Definitions

`DRAFT`: The specification is being written. No implementation may begin.

`REVIEW`: The specification is ready for architecture and consistency review. The architect may recommend approval or changes.

`APPROVED`: The user has approved the specification. Implementation may begin.

`IMPLEMENTING`: A write-capable implementer is making changes for the approved specification only.

`VERIFYING`: Implementation is complete enough for independent review, validation, and requirement traceability checks.

`COMPLETE`: The user has approved the final result after verification.

`BLOCKED`: Work is stopped pending human input or an external condition.

## Human Approval Gates

Only the user may authorize these transitions:

```text
REVIEW -> APPROVED
```

and:

```text
VERIFYING -> COMPLETE
```

Agents may recommend approval, but agents may not authorize either transition.

## Required Stages

### 1. Specification

Create or update one file under:

```text
specs/NNN-feature-name.md
```

The specification defines:

- goal
- context
- current state
- target flow
- functional requirements
- security requirements
- non-functional requirements
- out of scope
- expected files / components
- acceptance criteria
- automated validation
- manual verification
- rollback / failure behavior
- dependencies
- open questions

No implementation begins until the specification reaches `APPROVED`.

### 2. Architecture Review

A read-only architect reviews the specification.

The architect:

- checks consistency with current architecture
- checks current Solana APIs using MCP when relevant
- identifies risks
- identifies affected files
- identifies missing requirements
- identifies missing acceptance criteria
- recommends `APPROVE SPEC` or `REVISE SPEC`

The architect does not implement the feature.

### 3. Human Spec Approval

The user decides whether the spec may move from `REVIEW` to `APPROVED`.

No agent may approve its own proposal.

### 4. Implementation

One write-capable implementation agent implements only the approved specification.

The implementer:

- must not expand scope
- must not silently change requirements
- must stop on architectural ambiguity
- must run validation required by the spec
- must report every modified file
- must not mark the specification `COMPLETE`

Only one implementation agent may write to the active feature's files at a time unless work is explicitly isolated.

### 5. Independent Review

A reviewer that did not implement the feature compares:

- specification
- git diff
- tests
- repository rules
- security requirements
- validation results

For Solana program changes, the reviewer also uses the Solana MCP program review capability.

The reviewer does not silently fix failures.

### 6. Human Final Approval

The user is the final approval authority.

Agents may recommend completion, but only the user may authorize `VERIFYING -> COMPLETE`.

### 7. Completion

Only after human approval:

- mark the spec `COMPLETE`
- update `docs/MIGRATION_STATUS.md`
- commit implementation
- push, when requested

## Traceability IDs

Every requirement or acceptance item must have a stable ID:

```text
REQ-001
SEC-001
NFR-001
AC-001
```

Use:

- `REQ-xxx` for functional requirements
- `SEC-xxx` for security requirements
- `NFR-xxx` for non-functional requirements
- `AC-xxx` for acceptance criteria

## Reviewer Matrix

The independent reviewer must produce a final PASS / FAIL matrix covering:

```text
REQ-001: PASS / FAIL
SEC-001: PASS / FAIL
NFR-001: PASS / FAIL
AC-001: PASS / FAIL
```

The matrix must cover all `REQ`, `SEC`, `NFR`, and `AC` entries in the active specification.

## Change Control

An approved specification is immutable during implementation unless a required change is explicitly surfaced and approved.

If implementation reveals that an approved requirement must change:

```text
STOP
-> report affected requirement
-> explain problem
-> propose spec change
-> explain impact
-> wait for human approval
```

Do not silently reinterpret or modify requirements to make implementation pass.

## Parallel Agent Rule

Parallel subagents are appropriate for independent read-only work such as:

- documentation research
- security analysis
- API compatibility research
- test-plan review

Avoid parallel writes to the same files.

For implementation, prefer one write-capable agent per bounded approved specification.
