use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AnchorDeserialize, Discriminator, InstructionData, ToAccountMetas,
    },
    base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine},
    litesvm::{types::TransactionMetadata, LiteSVM},
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const DONOR_STARTING_LAMPORTS: u64 = 1_000_000_000;
const CREATOR_STARTING_LAMPORTS: u64 = 500_000_000;
const TIP_AMOUNT: u64 = 42_000;
const EMOTE_ID: u16 = 7;

fn setup() -> (LiteSVM, Pubkey, Keypair, Keypair) {
    let program_id = emotepay_program::id();
    let donor = Keypair::new();
    let creator = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/emotepay_program.so"
    ));

    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&donor.pubkey(), DONOR_STARTING_LAMPORTS)
        .unwrap();
    svm.airdrop(&creator.pubkey(), CREATOR_STARTING_LAMPORTS)
        .unwrap();

    (svm, program_id, donor, creator)
}

fn send_tip_sol(
    svm: &mut LiteSVM,
    program_id: Pubkey,
    donor: &Keypair,
    creator: Pubkey,
    amount: u64,
    emote_id: u16,
) -> litesvm::types::TransactionResult {
    let instruction = Instruction::new_with_bytes(
        program_id,
        &emotepay_program::instruction::TipSol { amount, emote_id }.data(),
        emotepay_program::accounts::TipSol {
            donor: donor.pubkey(),
            creator,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    let blockhash = svm.latest_blockhash();
    let message = Message::new_with_blockhash(&[instruction], Some(&donor.pubkey()), &blockhash);
    let transaction =
        VersionedTransaction::try_new(VersionedMessage::Legacy(message), &[donor]).unwrap();

    svm.send_transaction(transaction)
}

fn get_balance(svm: &LiteSVM, pubkey: &Pubkey) -> u64 {
    svm.get_balance(pubkey).unwrap_or_default()
}

fn decode_tip_event(meta: &TransactionMetadata) -> emotepay_program::TipEvent {
    let event_log = meta
        .logs
        .iter()
        .find_map(|log| log.strip_prefix("Program data: "))
        .expect("TipEvent log not found");
    let decoded = BASE64_STANDARD.decode(event_log).unwrap();
    let discriminator = emotepay_program::TipEvent::DISCRIMINATOR;

    assert!(decoded.starts_with(discriminator));

    let mut data = &decoded[discriminator.len()..];
    emotepay_program::TipEvent::deserialize(&mut data).unwrap()
}

#[test]
fn successful_sol_tip_transfers_exact_amount_and_emits_tip_event() {
    let (mut svm, program_id, donor, creator) = setup();
    let creator_before = get_balance(&svm, &creator.pubkey());
    let program_before = get_balance(&svm, &program_id);

    let meta = send_tip_sol(
        &mut svm,
        program_id,
        &donor,
        creator.pubkey(),
        TIP_AMOUNT,
        EMOTE_ID,
    )
    .unwrap();

    let creator_after = get_balance(&svm, &creator.pubkey());
    let program_after = get_balance(&svm, &program_id);
    let event = decode_tip_event(&meta);

    assert_eq!(creator_after - creator_before, TIP_AMOUNT);
    assert_eq!(program_after, program_before);
    assert_eq!(event.donor, donor.pubkey());
    assert_eq!(event.creator, creator.pubkey());
    assert_eq!(event.amount, TIP_AMOUNT);
    assert_eq!(event.emote_id, EMOTE_ID);
}

#[test]
fn zero_amount_fails() {
    let (mut svm, program_id, donor, creator) = setup();

    let result = send_tip_sol(&mut svm, program_id, &donor, creator.pubkey(), 0, EMOTE_ID);

    assert!(result.is_err());
}

#[test]
fn self_tip_fails() {
    let (mut svm, program_id, donor, _) = setup();

    let result = send_tip_sol(
        &mut svm,
        program_id,
        &donor,
        donor.pubkey(),
        TIP_AMOUNT,
        EMOTE_ID,
    );

    assert!(result.is_err());
}

#[test]
fn emote_id_zero_fails() {
    let (mut svm, program_id, donor, creator) = setup();

    let result = send_tip_sol(
        &mut svm,
        program_id,
        &donor,
        creator.pubkey(),
        TIP_AMOUNT,
        0,
    );

    assert!(result.is_err());
}
