import * as dotenv from 'dotenv';
import {
  percentAmount,
  generateSigner,
  signerIdentity,
  createSignerFromKeypair,
} from '@metaplex-foundation/umi';
import {
  TokenStandard,
  createAndMint,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import '@solana/web3.js';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
  Liquidity,
  LiquidityPoolKeys,
  Percent,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  jsonInfo2PoolKeys,
} from '@raydium-io/raydium-sdk';
import { getWalletTokenAccount, buildAndSendTx, sleepTime } from './utils/util';
import {
  connection,
  PROGRAMIDS,
  makeTxVersion,
  DEFAULT_TOKEN,
  wallet,
} from './utils/config';
import { BN } from 'bn.js';
import { createTokenInput } from './interface';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  NATIVE_MINT,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  setAuthority,
} from '@solana/spl-token';
import { createSolPairPoolInstruction } from './lib/pool';
import {
  ammAddSolPairLiquidityInstruction,
  ammRemoveLiquidityInstruction,
} from './lib/liquidity';
import { decodeLpTransaction } from './lib/helius';
import { formatAmmKeysById } from './lib/amm';
import { revokeTokenAuthorities } from './lib/token';
import { createSolPairMarket } from './lib/market';
dotenv.config();

const createWSOLTA = async (amount: number) => {
  let ata = await getAssociatedTokenAddress(
    NATIVE_MINT,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const ataInfo = await connection.getAccountInfo(ata);

  if (ataInfo === null) {
    let ataTx = new Transaction();
    ataTx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    ataTx.feePayer = wallet.publicKey;

    await sendAndConfirmTransaction(connection, ataTx, [wallet]);
  }

  // Check balance
  let balance = await connection.getBalance(ata);
  if (balance < amount * LAMPORTS_PER_SOL) {
    let solTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: ata,
        lamports: (amount - balance / LAMPORTS_PER_SOL) * LAMPORTS_PER_SOL,
      }),
      createSyncNativeInstruction(ata)
    );

    await sendAndConfirmTransaction(connection, solTx, [wallet]);
  }

  console.log(`Associated WSOL Token Account: ${ata.toBase58()}`);
};

const createToken = async (input: createTokenInput) => {
  const umi = createUmi(clusterApiUrl('mainnet-beta'));

  const userWallet = umi.eddsa.createKeypairFromSecretKey(
    bs58.decode(process.env.WALLET_PRIVATE_KEY!)
  );

  const userWalletSigner = createSignerFromKeypair(umi, userWallet);
  const mint = generateSigner(umi);
  umi.use(signerIdentity(userWalletSigner));
  umi.use(mplCandyMachine());

  const metadata = {
    name: 'Toast Token',
    description: 'This is the best toaster!',
    symbol: '$TOAST',
    image:
      'https://bafkreibef66m3qt53qzk2sdariyhqtz3ywbti7vdcn3k6pjpwcbxlqeulu.ipfs.nftstorage.link/',
    uri: 'https://bafkreibgkqupzp5ardbsynyefsxxsjbvybrajnujh7yos7vw46vbtot5fy.ipfs.nftstorage.link/',
  };

  // let amount = input.amount;
  let res = await createAndMint(umi, {
    mint,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: input.decimals,
    amount: input.amount * 10 ** input.decimals,
    tokenOwner: userWallet.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  return {
    mint: mint.publicKey,
  };
};

(async () => {
  try {
    const decimals = 9;
    const tokenAAmount = 1000000000;
    const minWsol = 1;
    const quoteBaseSize = 0.1;
    console.log(`Public Key..${wallet.publicKey}`);

    console.log(`Topup WSOL account to make up to ${minWsol} WSOL`);
    await createWSOLTA(minWsol);

    // 1. Mint token
    // let { mint } = await createToken({
    //   amount: tokenAAmount,
    //   decimals: decimals,
    // });
    let mint = new PublicKey('5QZ2JVsBqKfhcKg3oHivtoiDCUeXcC3oeAiAFcovKUdg');

    // Revoke authorities
    // await revokeTokenAuthorities(mint);

    // 3. Create Pool
    const mintToken = new Token(TOKEN_PROGRAM_ID, mint, decimals);

    const targetMarketId = Keypair.generate();
    console.log(`PUBLIC KEY: `, targetMarketId.publicKey.toBase58());
    // console.log(`PRIVATE KEY: `, targetMarketId.secretKey.toString());

    let walletTokenAccounts = await getWalletTokenAccount(
      connection,
      wallet.publicKey
    );

    let { instructions: createPoolInstruction } =
      await createSolPairPoolInstruction({
        addBaseAmount: new BN(tokenAAmount).mul(new BN(10 ** decimals)),
        addQuoteAmount: new BN(quoteBaseSize * LAMPORTS_PER_SOL),
        baseToken: mintToken,
        targetMarketId: targetMarketId.publicKey,
        startTime: Math.floor(Date.now() / 1000),
        walletTokenAccounts,
      });

    let { instructions: createMarketInstruction } = await createSolPairMarket({
      baseToken: mintToken,
      tickSize: 0.001,
      lotSize: 0.001,
    });

    await buildAndSendTx([
      ...createMarketInstruction,
      ...createPoolInstruction,
    ]);

    /** TESTING ONLY (LTX token) */
    // const targetMarketId = new PublicKey(
    //   'CuA6Yvcia2CZJfetLi9NwJeohx8XFYKuGLNQicZhuEGq'
    // );
    // const mint = 'LTXH7nCGXz5TBZ57H8oZu7YwmDSVfSqWViW4B28yg8X';
    // const mintToken = new Token(TOKEN_PROGRAM_ID, mint, 8);
    /** END TESTING */

    const targetPoolInfo = await formatAmmKeysById(
      targetMarketId.publicKey.toBase58()
    );
    if (!targetPoolInfo) {
      throw new Error('cannot find the target pool');
    }

    const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys;

    // 4. Add Liquidity to Pool
    let { instructions: addLiquidityInstructions } =
      await ammAddSolPairLiquidityInstruction({
        targetPool: targetMarketId.publicKey.toBase58(),
        inputSolAmount: new BN(quoteBaseSize * 10 ** 9),
        mint: mintToken,
        slippage: new Percent(1, 100),
        walletTokenAccounts,
        poolKeys,
        targetPoolInfo,
      });

    const instructions = [
      // ...createPoolInstruction,
      ...addLiquidityInstructions,
    ];

    let txids = await buildAndSendTx(instructions);

    // 5. Get total LP token from transaction
    let { tokenAmount } = await decodeLpTransaction(txids[0], wallet.publicKey);

    // sleep for X minute
    await sleepTime(0 * 60000);

    walletTokenAccounts = await getWalletTokenAccount(
      connection,
      wallet.publicKey
    );

    // 6. remove LP
    let { instructions: removeLiquidityInstructions } =
      await ammRemoveLiquidityInstruction({
        removeLpTokenAmount: tokenAmount,
        targetPool: targetMarketId.publicKey.toBase58(),
        walletTokenAccounts,
        poolKeys,
      });

    await buildAndSendTx(removeLiquidityInstructions);
  } catch (e) {
    console.log(e);
  }
})();
