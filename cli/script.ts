import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { IDL as BurningIDL } from "../target/types/burning";
import {
    Keypair,
    PublicKey,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    GLOBAL_AUTHORITY_SEED,
    GlobalPool,
    LIST_SEED,
    BURNING_PROGRAM_ID,
    LIST_POOL_SIZE,
    ListData,
} from './types';
import {
    getAssociatedTokenAccount,
    getATokenAccountsNeedCreate,
    getNFTTokenAccount,
    getOwnerOfNFT,
    getMetadata,
} from './utils';

let program: Program = null;

// Address of the deployed program.
let programId = new anchor.web3.PublicKey(BURNING_PROGRAM_ID);

anchor.setProvider(anchor.AnchorProvider.local(web3.clusterApiUrl("devnet")));
let provider = anchor.getProvider();

const solConnection = anchor.getProvider().connection;
const payer = anchor.AnchorProvider.local().wallet;

// Generate the program client from IDL.
program = new anchor.Program(BurningIDL as anchor.Idl, programId);
console.log('ProgramId: ', program.programId.toBase58());

const main = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

   
    // await initProject();

    // await register(new PublicKey("2ZQG7HFCHbEzjhkGPV1LyZpm6Pa1HVzEBqeuUaqVxWLk"), [2, 2], [0,0], [2,1]);
    await burnToGet(
        new PublicKey("2ZQG7HFCHbEzjhkGPV1LyZpm6Pa1HVzEBqeuUaqVxWLk"),
        [new PublicKey("5bdmtgmnXMF53ExQk3sY4fZuLGyyhK37yktupzQstC5P"),
        new PublicKey("8uTKRTgnYy1daddUP8FVakjFHGk2ZHPbauVatLcet5Gk"),
        new PublicKey("HG3cEXutUjfMnP62t6k61zPvTELZVN7EUHhg58vWadyw"),]
    )
    // console.log(await getAllListedNFTs(solConnection, undefined));
    // const state = await getListState(new PublicKey("2ZQG7HFCHbEzjhkGPV1LyZpm6Pa1HVzEBqeuUaqVxWLk"), program)
    // console.log(state)
};

export const initProject = async (
) => {
    const tx = await createInitializeTx(payer.publicKey, program);
    const txId = await provider.sendAndConfirm(tx, [], {
        commitment: "confirmed",
    });
    console.log("txHash =", txId);
}

export const register = async (
    mint: PublicKey,
    style: number[],
    artist: number[],
    amount: number[]
) => {
    const tx = await createRegisterTx(payer.publicKey, mint, style, artist, amount, program, solConnection);
    const txId = await provider.sendAndConfirm(tx, [], {
        commitment: "confirmed",
    });
    console.log("txHash =", txId);
}


export const burnToGet = async (
    mint: PublicKey,
    burnNfts: PublicKey[]
) => {
        const tx = await createBurnToGetTx(mint, burnNfts, payer.publicKey, program, solConnection);
        const txId = await provider.sendAndConfirm(tx, [], {
            commitment: "confirmed",
        });
        console.log("txHash =", txId);
    }
        



export const createInitializeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        BURNING_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing program');

    tx.add(program.instruction.initialize(
        {
        accounts: {
            admin: userAddress,
            globalAuthority,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createRegisterTx = async (
    userAddress: PublicKey,
    mint: PublicKey,
    style: number[],
    artist: number[],
    amount: number[],
    program: anchor.Program,
    connection: Connection,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        BURNING_PROGRAM_ID,
    );

    
    const [listData, listBump] = await PublicKey.findProgramAddress(
        [Buffer.from(LIST_SEED), mint.toBuffer()],
        BURNING_PROGRAM_ID,
    );

   
    let userNftTokenAccount = await getNFTTokenAccount(mint, connection);
    let nftOwner = await getOwnerOfNFT(mint, connection);
    if (nftOwner.toBase58() !== userAddress.toBase58()) {
        throw `You are not NFT owner`
    }

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())

    console.log(style);
    console.log(artist);
    console.log(amount);
    let tx = new Transaction();
    let mStyle: anchor.BN[] = [];
    let mArtist: anchor.BN[]= [];
    let mAmount: anchor.BN[]= [];
    for(let i = 0; i < style.length; i++) { 
        mStyle[i] = new anchor.BN(style[i]);
        mArtist[i] = new anchor.BN(artist[i]);
        mAmount[i] = new anchor.BN(amount[i]);
    }

    
    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    
    console.log('==> registering ... ', mint.toBase58());

    tx.add(program.instruction.register(
        mStyle, mArtist, mAmount,  {
        accounts: {
            owner: userAddress,
            globalAuthority,
            listData,
            userNftTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}


export const createBurnToGetTx = async (
    mint: PublicKey,
    burnNfts: PublicKey[],
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        BURNING_PROGRAM_ID,
    );

    const [listData, listBump] = await PublicKey.findProgramAddress(
        [Buffer.from(LIST_SEED), mint.toBuffer()],
        BURNING_PROGRAM_ID,
    );

    let remainingAccounts = [];
    for (let i = 0; i < burnNfts.length; i++) {
        let userNftTokenAccount = await getNFTTokenAccount(burnNfts[i], connection);
        let nftOwner = await getOwnerOfNFT(burnNfts[i], connection);
        if (nftOwner.toBase58() !== userAddress.toBase58()) {
            throw `You are not NFT owner`
        }
        const nftMetadata = await getMetadata(burnNfts[i]);
    
        remainingAccounts.push(
            {
                pubkey: nftMetadata,
                isSigner: false,
                isWritable: false,
            },
        );
        remainingAccounts.push(
            {
                pubkey: burnNfts[i],
                isSigner: false,
                isWritable: false,
            },
        );
        remainingAccounts.push(
            {
                pubkey: userNftTokenAccount,
                isSigner: false,
                isWritable: true,
            },
        );
        
    }

    let srcNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, mint);

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );


    let tx = new Transaction();
    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));

    console.log("burnToGet ...");
    console.log(userAddress.toBase58())
    console.log(srcNftTokenAccount.toBase58())
    console.log(destinationAccounts[0].toBase58())
    console.log(mint.toBase58())
    tx.add(program.instruction.burnToGet(
        bump, {
        accounts: {
            owner: userAddress,
            globalAuthority,
            listData,
            srcNftTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts,
        instructions: [],
        signers: [],
    }));

    return tx;
}


export const getGlobalState = async (
    program: anchor.Program,
): Promise<GlobalPool | null> => {
    const [globalAuthority, _] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        BURNING_PROGRAM_ID
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as unknown as GlobalPool;
    } catch {
        return null;
    }
}

export const getListState = async (
    mint: PublicKey,
    program: anchor.Program,
): Promise<ListData | null> => {
    const [listData, listBump] = await PublicKey.findProgramAddress(
        [Buffer.from(LIST_SEED), mint.toBuffer()],
        BURNING_PROGRAM_ID,
    );
    try {
        let globalState = await program.account.listData.fetch(listData);
        return globalState as unknown as ListData;
    } catch {
        return null;
    }
}
export const getAllListedNFTs = async (connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
        BURNING_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: LIST_POOL_SIZE,
                },
            ]
        }
    );

    console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

    let result: ListData[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const mint = new PublicKey(data.slice(8, 40));

            let buf;
            let style: number[] = [];
            for (let i = 0; i < 8; i++) {
                buf = data.slice(40+i*8, 40+i*8+8).reverse();
                style.push((new anchor.BN(buf)).toNumber())
            }

            let artist: number[] = [];
            for (let i = 0; i < 8; i++) {
                buf = data.slice(104+i*8, 104+i*8+8).reverse();
                artist.push((new anchor.BN(buf)).toNumber())
            }
            
            let amount: number[] = [];
            for (let i = 0; i < 8; i++) {
                buf = data.slice(168+i*8, 168+i*8+8).reverse();
                amount.push((new anchor.BN(buf)).toNumber())
            }


            result.push({
                mint,
                style,
                artist,
                amount,
            });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return result;
};

main();
