import 'dotenv/config';
import { LPTransaction } from '../interface/transaction';
import { PublicKey } from '@solana/web3.js';
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
} from '@raydium-io/raydium-sdk';
import { connection } from '../utils/config';
import { sleepTime } from '../utils/util';

export const decodeLpTransaction = async (
  signature: string,
  publicKey: PublicKey
): Promise<LPTransaction> => {
  while (true) {
    try {
      let status = await connection.getSignatureStatus(signature);
      if (status?.value?.confirmationStatus === 'confirmed') {
        break;
      }

      await sleepTime(5000);
    } catch (e) {
      console.log(e);
    }
  }

  let res = await fetch(
    `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}&commitment=confirmed`,
    {
      method: 'POST',
      body: JSON.stringify({
        transactions: [`${signature}`],
      }),
    }
  );

  const json = await res.json();
  const tx = json[0];
  const lpToken = tx.tokenTransfers.find(
    (e: any) => e.toUserAccount === publicKey.toBase58()
  );

  // Raydium LP token is 8 decimals
  const token = new Token(TOKEN_PROGRAM_ID, lpToken.mint, 8);
  const roundedDown = Math.floor(lpToken.tokenAmount * 100) / 100;
  const tokenAmount = new TokenAmount(token, roundedDown.toString(), false);

  return {
    signature,
    totalLPToken: lpToken.tokenAmount,
    tokenAmount,
  };
};
