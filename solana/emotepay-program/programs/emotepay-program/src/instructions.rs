use anchor_lang::prelude::*;

use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct TipSol<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_tip_sol(ctx: Context<TipSol>, amount: u64, emote_id: u16) -> Result<()> {
    require!(amount > 0, ErrorCode::ZeroTip);
    require!(emote_id > 0, ErrorCode::InvalidEmote);
    require_keys_neq!(
        ctx.accounts.donor.key(),
        ctx.accounts.creator.key(),
        ErrorCode::SelfTipNotAllowed,
    );

    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.donor.to_account_info(),
        to: ctx.accounts.creator.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(anchor_lang::system_program::ID, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    emit!(TipEvent {
        donor: ctx.accounts.donor.key(),
        creator: ctx.accounts.creator.key(),
        amount,
        emote_id,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct TipEvent {
    pub donor: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub emote_id: u16,
    pub timestamp: i64,
}
