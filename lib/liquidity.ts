import {
  AddLiquidityTxInputInfo,
  RemoveLiquidityTxInputInfo,
} from '../interface';
import {
  CurrencyAmount,
  Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
  TokenAmount,
  InnerSimpleV0Transaction,
  divCeil,
} from '@raydium-io/raydium-sdk';
import { formatAmmKeysById } from './amm';
import {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  wallet,
} from '../utils/config';
import Decimal from 'decimal.js';
import { buildAndSendTx } from '../utils/util';
import { BN } from 'bn.js';

export const ammAddSolPairLiquidityInstruction = async (
  input: AddLiquidityTxInputInfo
): Promise<{
  instructions: InnerSimpleV0Transaction[];
  anotherAmount: TokenAmount | CurrencyAmount;
}> => {
  const extraPoolInfo = await Liquidity.fetchInfo({
    connection,
    poolKeys: input.poolKeys,
  });

  const { baseReserve, quoteReserve } = extraPoolInfo;
  console.log('baseReserve:', baseReserve.toString());
  console.log('quoteReserve:', quoteReserve.toString());
  const amountInA = divCeil(
    input.inputSolAmount.mul(baseReserve),
    quoteReserve
  );

  console.log('number of token', amountInA.toString());

  const inputTokenAmount = new TokenAmount(input.mint, amountInA);

  const { maxAnotherAmount, anotherAmount, liquidity } =
    Liquidity.computeAnotherAmount({
      poolKeys: input.poolKeys,
      poolInfo: { ...input.targetPoolInfo, ...extraPoolInfo },
      amount: inputTokenAmount,
      anotherCurrency: DEFAULT_TOKEN.WSOL,
      slippage: input.slippage,
    });

  // -------- step 2: make instructions --------
  const addLiquidityInstructionResponse =
    await Liquidity.makeAddLiquidityInstructionSimple({
      connection,
      poolKeys: input.poolKeys,
      userKeys: {
        owner: wallet.publicKey,
        payer: wallet.publicKey,
        tokenAccounts: input.walletTokenAccounts,
      },
      amountInA: inputTokenAmount,
      amountInB: maxAnotherAmount,
      fixedSide: 'a',
      makeTxVersion,
    });

  return {
    instructions: addLiquidityInstructionResponse.innerTransactions,
    anotherAmount,
  };
};

export const ammRemoveLiquidityInstruction = async (
  input: RemoveLiquidityTxInputInfo
) => {
  const removeLiquidityInstructionResponse =
    await Liquidity.makeRemoveLiquidityInstructionSimple({
      connection,
      poolKeys: input.poolKeys,
      userKeys: {
        owner: wallet.publicKey,
        payer: wallet.publicKey,
        tokenAccounts: input.walletTokenAccounts,
      },
      amountIn: input.removeLpTokenAmount,
      makeTxVersion,
    });

  return {
    instructions: removeLiquidityInstructionResponse.innerTransactions,
  };
};
