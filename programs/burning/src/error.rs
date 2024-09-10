use anchor_lang::prelude::*;

#[error_code]
pub enum BurningError {
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Invalid Global Pool Address")]
    InvalidGlobalPool,

    #[msg("Invalid Data Counter")]
    InvalidDataCounter,
    #[msg("Invalid Admin Address")]
    InvalidAdminAddress,
    
    #[msg("Invalid Set Amount")]
    InvalidSetAmount,

    #[msg("Invalid Withdraw Time")]
    InvalidWithdrawTime,
    #[msg("Not Found Staked Mint")]
    InvalidNFTAddress,

    #[msg("Insufficient Reward Token Balance")]
    InsufficientRewardVault,
    #[msg("Insufficient Token Balance")]
    InsufficientTokenAmount,


    #[msg("Invalid Metadata Address")]
    InvaliedMetadata,
    #[msg("Can't Parse The NFT's Creators")]
    MetadataCreatorParseError,
    #[msg("Unknown Collection Or The Collection Is Not Allowed")]
    UnkownOrNotAllowedNFTCollection,
}