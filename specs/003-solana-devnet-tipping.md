# SPEC-003 — Solana Devnet Tipping Flow

## Status

VERIFYING

## Goal

Habilitar el flujo integral de donación no custodial de SOL en **Solana Devnet** desde el frontend de EmotePay.
El viewer autenticado con su embedded wallet de Privy podrá seleccionar un emote, firmar la transacción de la instrucción `tip_sol` del programa Anchor (`EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL`), transferir SOL al creador, obtener la confirmación y visualizar su firma de transacción (signature) con enlace al Solana Explorer.

## Context

- **Fase 1 (Completada):** Autenticación de usuarios vía Privy y aprovisionamiento de wallet embebida en Solana Devnet con dirección Base58 (`SPEC-001`).
- **Fase 2 (Completada):** Desarrollo y testeo local del programa Anchor con la instrucción `tip_sol`, validaciones de seguridad (anti self-tip, anti zero-tip, validación de emote) y emisión de `TipEvent` (`SPEC-002`).
- **Fase 3 (Esta especificación):** Conexión de la capa cliente frontend con el programa Anchor en Devnet. Migración de tipos residuales de EVM/Monad a Solana y habilitación del botón de envío transaccional en la interfaz de usuario.

---

## Current State

1. El frontend (`app/page.tsx`) detecta la sesión de Privy y la clave pública Solana del usuario, pero el botón de donación está bloqueado permanentemente (`canSendReaction = false`) con el mensaje `"SOL tipping starts in Phase 2"`.
2. Las estructuras de datos en `lib/emotes.ts` utilizan denominaciones de Monad (`amountMon`, `"0.001 MON"`).
3. El estado en `lib/payment.ts` modela el hash con formato EVM (`0x${string}`).
4. El programa Anchor (`EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL`) compila y pasa tests unitarios locales con LiteSVM, pero no está cableado a la UI del frontend.

---

## Target Flow

```text
Viewer selecciona Emote + Mensaje opcional
  ↓
Viewer presiona "Send Reaction"
  ↓
Frontend construye la instrucción Anchor `tip_sol(amount_lamports, emote_id)`
  [Opcional: instrucción Memo con el mensaje del viewer]
  ↓
Privy Embedded Wallet firma la transacción
  ↓
Transmisión al RPC de Solana Devnet
  ↓
Confirmación de transacción (compromiso: 'confirmed')
  ↓
Frontend actualiza estado a 'success'
  y muestra Transaction Signature en Base58 con enlace a Solana Explorer
```

---

## Functional Requirements

### REQ-001: Migración del Modelo de Datos de Donación
El archivo `lib/emotes.ts` debe redefinir los emotes con montos expresados en SOL y en `lamports` (`bigint`):
- `🔥 Hype Fire`: 0.001 SOL (1,000,000 lamports)
- `🚀 To The Moon`: 0.005 SOL (5,000,000 lamports)
- `👑 King/Queen`: 0.01 SOL (10,000,000 lamports)
- `💎 Diamond Hands`: 0.025 SOL (25,000,000 lamports)

### REQ-002: Adaptación de Estados de Pago
El archivo `lib/payment.ts` debe reemplazar el identificador de transacción EVM (`0x${string}`) por una firma Base58 de Solana (`signature: string`) y reflejar estados claros:
- `idle`
- `ready`
- `signing` (esperando aprobación del signer)
- `confirming` (transacción enviada, esperando confirmación de bloque)
- `success` (confirmada en Devnet, con enlace al explorer)
- `error` (con mensaje descriptivo de fallo)

### REQ-003: Construcción de la Instrucción `tip_sol`
Se creará un módulo cliente (`lib/solana/transaction.ts` o `lib/solana/client.ts`) que codifique la instrucción de Anchor:
- **Program ID:** `EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL`
- **Accounts:**
  - `donor`: Signer (clave pública de la wallet del usuario)
  - `creator`: Writable SystemAccount (clave pública del creador configurada)
  - `system_program`: `11111111111111111111111111111111`
- **Args:**
  - `amount`: `u64` (en lamports)
  - `emote_id`: `u16` (identificador numérico del emote: 1 a 4)

### REQ-004: Firma y Envío con Privy Solana Wallet
El frontend debe utilizar el proveedor de wallet de Solana expuesto por Privy (`useSolanaWallets()` / `sendTransaction`) para firmar y transmitir la transacción directamente al cluster Devnet configurado.

### REQ-005: Confirmación y Enlace a Explorer
Una vez transmitida la transacción, el cliente debe esperar la confirmación de la red y generar una URL válida hacia Solana Explorer:
`https://explorer.solana.com/tx/{signature}?cluster=devnet`.

### REQ-006: Validación de Autodonación (Self-Tip) y Configuración
La interfaz debe deshabilitar la acción y mostrar advertencia si:
- La clave pública de la wallet del donor es idéntica a la del creador.
- La dirección del creador no está configurada o es inválida.
- El usuario no tiene sesión iniciada o la wallet no está inicializada.

---

## Security Requirements

### SEC-001: No Custodia de Claves Privadas
Las claves privadas de la wallet embebida residen y son firmadas exclusivamente dentro del enclave de Privy. La aplicación jamás solicita, almacena ni expone claves privadas.

### SEC-002: Transferencia Directa y Segura
La transferencia de SOL se ejecuta directamente desde la cuenta del donante hacia la cuenta del creador mediante CPI al System Program dentro del programa Anchor. No existen contratos puente intermediarios con custodia de fondos.

### SEC-003: Validación Pre-Firma
Antes de solicitar la firma al usuario, el cliente valida estrictamente que la cuenta de destino sea una dirección Solana válida y que el cluster objetivo sea exclusivamente **Solana Devnet**.

---

## Non-Functional Requirements

### NFR-001: Compatibilidad de Dependencias
Se debe respetar la directiva de `AGENTS.md`: utilizar `@solana/kit 5.5.1` y la versión instalada de `@privy-io/react-auth`. No se deben agregar librerías redundantes (como `@solana/web3.js` legacy) sin justificación explícita aprobada.

### NFR-002: Calidad y Tipado Estricto
El código TypeScript debe compilar limpiamente con `npx tsc --noEmit` y pasar el linter `npm run lint` sin advertencias bloqueantes.

---

## Out of Scope

- Pagos en USDC o tokens SPL (reservado para fase posterior).
- Fee sponsorship / transacciones gasless (el donante paga su propia comisión de red).
- Modificación del listener de OBS en `/overlay` (asignado a la fase de OBS con Facundo).
- Indexación de historial con Envio o bases de datos externas.
- Despliegue en Solana Mainnet.

> TODO OBS/Solana: la animación de alerta agregada en la home es solamente una
> previsualización local. La ruta `/overlay` todavía utiliza el flujo anterior
> EVM/Envio y debe migrarse en una fase posterior para consumir eventos
> Solana `TipEvent` reales, deduplicarlos y filtrar por creador.

---

## Expected Files / Components

- `specs/003-solana-devnet-tipping.md`: Esta especificación.
- `lib/emotes.ts`: Actualización a SOL y lamports.
- `lib/payment.ts`: Actualización de estados y tipos de firma Solana.
- `lib/solana/transaction.ts` (Nuevo): Lógica de codificación y construcción de la transacción `tip_sol`.
- `app/page.tsx`: Cableado del flujo de envío, estados de carga y feedback de éxito/error.

---

## Acceptance Criteria

### AC-001: Catálogo de Emotes en SOL
Dado que el usuario ingresa a la aplicación,
Cuando visualiza el selector de emotes,
Entonces los precios se presentan en SOL (ej. `0.001 SOL`, `0.01 SOL`) con el correspondiente mapeo a lamports.

### AC-002: Desbloqueo de Botón
Dado un usuario autenticado con wallet de Solana Devnet y saldo suficiente,
Cuando selecciona un emote válido para un creador configurado diferente a sí mismo,
Entonces el botón `"Send Reaction"` está habilitado y listo para accionar.

### AC-003: Ejecución de Transacción Exitosa
Dado que el usuario pulsa `"Send Reaction"`,
Cuando Privy solicita la firma y la transacción se confirma en Devnet,
Entonces la UI muestra el estado de éxito con la firma en Base58 y un enlace funcional a Solana Explorer.

### AC-004: Manejo de Errores y Rechazos
Dado que el usuario cancela la firma o la transacción falla por balance insuficiente,
Cuando la promesa rechaza,
Entonces la interfaz vuelve a un estado recuperable mostrando el mensaje de error correspondiente sin bloquear la aplicación.

---

## Automated Validation

```bash
# Instalación de dependencias del frontend
npm install

# Verificación de tipado estático
npx tsc --noEmit

# Verificación de linter
npm run lint

# Build de producción para comprobar integridad del bundle
npx next build --webpack
```

---

## Manual Verification

1. Iniciar sesión en el frontend (`http://localhost:3000`) con cuenta Google / Email.
2. Confirmar que la wallet embebida muestra una clave pública Base58 en Devnet.
3. Asegurar fondos de prueba en Devnet para la wallet de prueba (vía Solana Faucet).
4. Configurar en `.env.local` una clave pública de creador (`NEXT_PUBLIC_CREATOR_SOLANA_ADDRESS`) distinta a la del usuario.
5. Donar 0.001 SOL seleccionando el emote 🔥 Hype Fire.
6. Aprobar la transacción y verificar que el hash conduce a la confirmación exitosa en `explorer.solana.com/?cluster=devnet`.

---

## Traceability Matrix

```text
REQ-001: PASS
REQ-002: PASS
REQ-003: PASS
REQ-004: PASS
REQ-005: PASS
REQ-006: PASS

SEC-001: PASS
SEC-002: PASS
SEC-003: PASS

NFR-001: PASS
NFR-002: PASS

AC-001: PASS
AC-002: PASS
AC-003: PASS
AC-004: PASS
```

## Completion

- Implementation branch: `franco-dev`
- Implementation commit: TBD
- Review result: TBD
- Human approval: PENDING
