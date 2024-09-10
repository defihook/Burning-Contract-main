# BurnToGet_program
This is the anchor program to get NFTs by burning other tier's NFT

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/---/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/target/types/burning.ts`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `script.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

# Features

##  How to deploy this program?
First of all, you have to git clone in your PC.
In the folder `burning`, in the terminal 
1. `yarn`

2. `anchor build`
   In the last sentence you can see:  
```
To deploy this program:
  $ solana program deploy /home/ubuntu/apollo/B2S_Contract/burning/target/deploy/burning.so
The program address will default to this keypair (override with --program-id):
  /home/ubuntu/apollo/B2S_Contract/burning/target/deploy/burning-keypair.json
```  
3. `solana-keygen pubkey /home/ubuntu/apollo/B2S_Contract/burning/target/deploy/burning-keypair.json`
4. You can get the pubkey of the `program ID : ex."5N...x6k"`
5. Please add this pubkey to the lib.rs
  `line 17: declare_id!("5N...x6k");`
6. Please add this pubkey to the Anchor.toml
  `line 4: staking = "5N...x6k"`
7. Please add this pubkey to the types.ts
  `line 6: export const BURNING_PROGRAM_ID = new PublicKey("5N...x6k");`
  
8. `anchor build` again
9. `solana program deploy /home/.../backend/target/deploy/burning.so`

<p align = "center">
Then, you can enjoy this program 🎭
</p>
</br>

## How to use?

### A Project Owner
First of all, open the directory and `yarn`

#### Initproject

You can change you wallet address in the package.json.
And de-comment the following statements
```js
    await initProject();

    // await register(new PublicKey("2ZQ..WLk"), [2, 2], [0,0], [2,1]);
    // await burnToGet(
    //     new PublicKey("2ZQ...WLk"),
    //     [
    //          new PublicKey("5bd...C5P"),
    //          new PublicKey("8uT...5Gk"),
    //          new PublicKey("HG3...dyw"),
    //      ]
    // )
```
Then, in the `/burning` folder
```shell
yarn ts-node
```

#### Register

You can send the NFT which will be listed in the marketplace. 
```js
Style Set:
Random      => 0
"Black"     => 1
"Silver"    => 2
"Gold"      => 3
"Diamond"   => 4

Artist Set:
Random          => 0
"Big Pun"       => 1 
"The Game"      => 2
"April Walker"  => 3
"Drink Champs"  => 4
"Onyx"          => 5

eg:
// if users should burn Silver -> 2, Gold/Onyx -> 3, Diamond -> 1
style   = [2, 3, 4]
artist  = [0, 5, 0]
amount  = [2, 3, 1]
```

```js
    // await initProject();

    await register(new PublicKey("2ZQ..WLk"), [2, 3, 4], [0, 5, 0], [2, 3, 1]);
    // await burnToGet(
    //     new PublicKey("2ZQ...WLk"),
    //     [
    //          new PublicKey("5bd...C5P"),
    //          new PublicKey("8uT...5Gk"),
    //          new PublicKey("HG3...dyw"),
    //      ]
    // )
```
Then, in the `/burning` folder
```shell
yarn ts-node
```

#### BurnToGet
Users can burn NFTs to get the NFT. Users should burn total amount of NFTs.(eg. 2+3+1 = 6)

```js
    // await initProject();

    // await register(new PublicKey("2ZQ..WLk"), [2, 3, 4], [0, 5, 0], [2, 3, 1]);
    await burnToGet(
        new PublicKey("2ZQ...WLk"),
        [
             new PublicKey("5bd...C5P"),
             new PublicKey("8uT...5Gk"),
             new PublicKey("HG3...dyw"),
             new PublicKey("54d...C5P"),
             new PublicKey("1uT...5Gk"),
             new PublicKey("kG3...dyw"),
         ]
    )
```

Then, in the `/burning` folder
```shell
yarn ts-node
```
