import { TokenAmount } from '@raydium-io/raydium-sdk';

export interface LPTransaction {
  signature: string;
  totalLPToken: number;
  tokenAmount: TokenAmount;
}
