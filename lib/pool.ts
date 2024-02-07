import { InnerSimpleV0Transaction, Liquidity } from '@raydium-io/raydium-sdk';
import { CreatePoolTxInputInfo } from '../interface';
import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  PROGRAMIDS,
  wallet,
} from '../utils/config';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { buildAndSendTx } from '../utils/util';

export const createSolPairPoolInstruction = async (
  input: CreatePoolTxInputInfo
): Promise<{ instructions: InnerSimpleV0Transaction[] }> => {
  const initPoolInstructionResponse =
    await Liquidity.makeCreatePoolV4InstructionV2Simple({
      connection,
      programId: PROGRAMIDS.AmmV4,
      marketInfo: {
        marketId: input.targetMarketId,
        programId: PROGRAMIDS.OPENBOOK_MARKET,
      },
      baseMintInfo: input.baseToken,
      quoteMintInfo: DEFAULT_TOKEN.WSOL,
      baseAmount: input.addBaseAmount,
      quoteAmount: input.addQuoteAmount,
      startTime: new BN(Math.floor(input.startTime)),
      ownerInfo: {
        feePayer: wallet.publicKey,
        wallet: wallet.publicKey,
        tokenAccounts: input.walletTokenAccounts,
        useSOLBalance: true,
      },
      associatedOnly: false,
      checkCreateATAOwner: true,
      makeTxVersion,
      feeDestinationId: new PublicKey(
        '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'
      ),
    });

  return {
    instructions: initPoolInstructionResponse.innerTransactions,
  };
};
