import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export const GLOBAL_AUTHORITY_SEED = "global-authority";
export const LIST_SEED = "list-authority";

export const BURNING_PROGRAM_ID = new PublicKey("3odjqzDkeYVZXjZa9L1sV3z93ohGTbaqGTh9P8D9qW9C");
export const LIST_POOL_SIZE = 232;

export interface GlobalPool {
    // 8 + 40
    superAdmin: PublicKey,              // 32
}

export interface ListData {
    mint: PublicKey,            
    style: number[],      
    artist: number[],        
    amount: number[],       
}