pub mod error;
pub mod instructions;

use anchor_lang::prelude::*;

pub use instructions::*;

declare_id!("EQEjzX3Kd2JpMzqK9gF32gznDonmLtcuj7fMot4w22nL");

#[program]
pub mod emotepay_program {
    use super::*;

    pub fn tip_sol(ctx: Context<TipSol>, amount: u64, emote_id: u16) -> Result<()> {
        crate::instructions::handle_tip_sol(ctx, amount, emote_id)
    }
}
