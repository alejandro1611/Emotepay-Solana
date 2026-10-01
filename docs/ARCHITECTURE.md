# EmotePay Architecture

## Product flow

Viewer
→ Privy
→ Solana embedded wallet
→ EmotePay Anchor program
→ Creator
→ TipEvent
→ OBS / indexer

## Components

### Frontend
Next.js
Privy
Framer Motion

### Program
Anchor

Instructions:
- tip_sol
- future: tip_usdc

### Realtime
TipEvent
→ Solana WebSocket / Helius
→ OBS overlay

### Analytics
Solana events
→ indexer
→ creator dashboard

## Data ownership

Onchain:
- payment
- creator
- donor
- amount
- emote id

Offchain:
- donation message
- AI classification
- analytics
- stream metadata