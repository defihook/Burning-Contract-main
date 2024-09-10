use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Transfer};
use metaplex_token_metadata::state::Metadata;
// use solana_program::program::invoke_signed;

pub mod account;
pub mod constants;
pub mod error;

use account::*;
use constants::*;
use error::*;

declare_id!("3odjqzDkeYVZXjZa9L1sV3z93ohGTbaqGTh9P8D9qW9C");

#[program]
pub mod burning {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn register(
        ctx: Context<Register>,
        style: Vec<u64>,
        artist: Vec<u64>,
        amount: Vec<u64>,
    ) -> Result<()> {
        require!(
            style.len() == artist.len() && artist.len() == amount.len(),
            BurningError::InvalidDataCounter
        );

        let list_data = &mut ctx.accounts.list_data;

        let mut n = 0;
        for i in 0..5 {
            if ctx.accounts.owner.key() == ADMIN_WALLET[i].parse::<Pubkey>().unwrap() {
                n = 1;
            }
        }
        require!(n == 1, BurningError::InvalidAdminAddress);

        let src_token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: src_token_account_info.to_account_info().clone(),
            to: dest_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.owner.to_account_info().clone(),
        };
        token::transfer(
            CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
            1,
        )?;

        list_data.mint = ctx.accounts.nft_mint.key();
        for i in 0..style.len() {
            list_data.style[i as usize] = style[i as usize];
            list_data.artist[i as usize] = artist[i as usize];
            list_data.amount[i as usize] = amount[i as usize];
        }

        Ok(())
    }

    pub fn burn_to_get<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, BurnToGet<'info>>,
        global_bump: u8,
    ) -> Result<()> {
        let list_data = &mut ctx.accounts.list_data;
        require!(
            list_data.mint == ctx.accounts.nft_mint.key(),
            BurningError::InvalidNFTAddress
        );

        let remaining_accounts: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();

        let nft_count = remaining_accounts.len() / 3;

        let mut option = 0;
        let mut v_style: [&str; 8] = [""; 8];
        let mut v_artist: [&str; 8] = [""; 8];
        let mut v_amount: [u64; 8] = [0; 8];

        for i in 0..8 {
            if list_data.amount[i] == 0 {
                option = i as u64;
                break;
            }
            match list_data.style[i] {
                0 => {
                    v_style[i] = "";
                }
                1 => {
                    v_style[i] = "Black";
                }
                2 => {
                    v_style[i] = "Silver";
                }
                3 => {
                    v_style[i] = "Gold";
                }
                4 => {
                    v_style[i] = "Diamond";
                }
                _ => panic!(),
            }

            match list_data.artist[i] {
                0 => {
                    v_artist[i] = "";
                }
                1 => {
                    v_artist[i] = "Big Pun";
                }
                2 => {
                    v_artist[i] = "The Game";
                }
                3 => {
                    v_artist[i] = "April Walker";
                }
                4 => {
                    v_artist[i] = "Drink Champs";
                }
                5 => {
                    v_artist[i] = "Onyx";
                }
                _ => panic!(),
            }
        }

        let joker = "Joker";
        let mut j_count = 0;
        for i in 0..nft_count {
            let metadata = Metadata::from_account_info(&remaining_accounts[i * 3])?;
            // Check if this NFT is the wanted collection and verified
            if let Some(creators) = metadata.data.creators {
                let mut valid: u8 = 0;
                for creator in creators {
                    if creator.address.to_string() == NFT_CREATOR && creator.verified == true {
                        valid = 1;
                        break;
                    }
                }
                require!(valid == 1, BurningError::UnkownOrNotAllowedNFTCollection);
            } else {
                return Err(error!(BurningError::MetadataCreatorParseError));
            };

            for j in 0..option {
                if metadata.data.name.find(v_style[j as usize]) != None
                    && metadata.data.name.find(v_artist[j as usize]) != None
                {
                    v_amount[j as usize] += 1;
                }
                if metadata.data.name.find(joker) != None {
                    j_count += 1;
                }
            }
        }

        for i in 0..option {
            if list_data.style[i as usize] == 4
                && list_data.amount[i as usize] > v_amount[i as usize]
            {
                require!(
                    v_amount[i as usize] + j_count >= list_data.amount[i as usize],
                    BurningError::InvalidSetAmount
                );
            } else {
                require!(
                    v_amount[i as usize] >= list_data.amount[i as usize],
                    BurningError::InvalidSetAmount
                );
            }
        }

        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        for i in 0..nft_count {
            let cpi_accounts = Burn {
                mint: remaining_accounts[i * 3 + 1].to_account_info().clone(),
                from: remaining_accounts[i * 3 + 2].to_account_info().clone(),
                authority: ctx.accounts.owner.to_account_info().clone(),
            };
            token::burn(
                CpiContext::new(token_program.to_account_info(), cpi_accounts),
                1,
            )?;
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.src_nft_token_account.to_account_info(),
            to: ctx.accounts.dest_nft_token_account.to_account_info(),
            authority: ctx.accounts.global_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info().clone(),
                cpi_accounts,
                signer,
            ),
            1,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        space = 8 + 32,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        init,
        seeds = [LIST_SEED.as_ref(),  nft_mint.key.as_ref()],
        bump,
        space = 8 + 224,
        payer = owner
    )]
    pub list_data: Account<'info, ListData>,

    #[account(
        mut,
        constraint = user_nft_token_account.mint == nft_mint.key(),
        constraint = user_nft_token_account.owner == *owner.key,
        constraint = user_nft_token_account.amount == 1,
    )]
    pub user_nft_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnToGet<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        mut,
        seeds = [LIST_SEED.as_ref(),  nft_mint.key.as_ref()],
        bump,
    )]
    pub list_data: Account<'info, ListData>,

    #[account(
        mut,
        constraint = src_nft_token_account.mint == nft_mint.key(),
        constraint = src_nft_token_account.owner == global_authority.key(),
        constraint = src_nft_token_account.amount == 1,
    )]
    pub src_nft_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == *owner.key,
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
