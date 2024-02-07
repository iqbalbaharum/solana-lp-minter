import { Percent, Token, TokenAmount } from '@raydium-io/raydium-sdk';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getWalletTokenAccount } from '../utils/util';
import BN from 'bn.js';

export type LiquidityPairTargetInfo = {};

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>;

export type CreatePoolTxInputInfo = {
  addBaseAmount: BN;
  addQuoteAmount: BN;
  baseToken: Token;
  targetMarketId: PublicKey;
  startTime: number;
  walletTokenAccounts: WalletTokenAccounts;
};

export interface createTokenInput {
  amount: number;
  decimals: number;
}

export type AddLiquidityTxInputInfo = {
  targetPool: string;
  inputTokenAmount?: TokenAmount;
  inputSolAmount: BN;
  mint: Token;
  slippage: Percent;
  walletTokenAccounts: WalletTokenAccounts;
  poolKeys: any;
  targetPoolInfo: any;
};

export type RemoveLiquidityTxInputInfo = {
  removeLpTokenAmount: TokenAmount;
  targetPool: string;
  walletTokenAccounts: WalletTokenAccounts;
  poolKeys: any;
};

export type CreateMarketTxInputInfo = {
  baseToken: Token;
  lotSize: number;
  tickSize: number;
};
