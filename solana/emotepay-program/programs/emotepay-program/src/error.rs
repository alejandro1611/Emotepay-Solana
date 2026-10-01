use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Tip amount must be greater than zero")]
    ZeroTip,
    #[msg("Donor cannot tip themselves")]
    SelfTipNotAllowed,
    #[msg("Emote id must be greater than zero")]
    InvalidEmote,
}
