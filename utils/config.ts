import 'dotenv/config';
import {
  ENDPOINT as _ENDPOINT,
  Currency,
  LOOKUP_TABLE_CACHE,
  MAINNET_PROGRAM_ID,
  RAYDIUM_MAINNET,
  Token,
  TOKEN_PROGRAM_ID,
  TxVersion,
} from '@raydium-io/raydium-sdk';
import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import 'dotenv/config';
import bs58 from 'bs58';
export const rpcUrl: string =
  'https://solana-mainnet.g.alchemy.com/v2/UzFa0aUaP9MzMBYXKiawpcs9smelAPn6';
export const rpcToken: string | undefined = undefined;

export const wallet = Keypair.fromSecretKey(
  bs58.decode(process.env.WALLET_PRIVATE_KEY!)
);

export const connection = new Connection(rpcUrl);

export const PROGRAMIDS = MAINNET_PROGRAM_ID;

export const ENDPOINT = _ENDPOINT;

export const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;

export const makeTxVersion = TxVersion.V0; // LEGACY

export const RAYDIUM_LP_DECIMAL = 9;

export const addLookupTableInfo = LOOKUP_TABLE_CACHE; // only mainnet. other = undefined

export const DEFAULT_TOKEN = {
  SOL: new Currency(9, 'USDC', 'USDC'),
  WSOL: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('So11111111111111111111111111111111111111112'),
    9,
    'WSOL',
    'WSOL'
  ),
  USDC: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    6,
    'USDC',
    'USDC'
  ),
  RAY: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    6,
    'RAY',
    'RAY'
  ),
  'RAY_USDC-LP': new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'),
    6,
    'RAY-USDC',
    'RAY-USDC'
  ),
};
