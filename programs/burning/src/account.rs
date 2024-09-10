use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
#[derive(Default)]
pub struct GlobalPool {
    // 8 + 32
    pub super_admin: Pubkey,     // 32
}

#[account]
#[derive(Default)]
pub struct ListData {
    pub mint: Pubkey,               // 32
    pub style: [u64; MAX_OPTION],    // 64
    pub artist: [u64; MAX_OPTION],   // 64
    pub amount: [u64; MAX_OPTION],   // 64
}
