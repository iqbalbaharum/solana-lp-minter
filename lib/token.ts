import {
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createRevokeInstruction,
  createSetAuthorityInstruction,
  revoke,
  setAuthority,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { connection, wallet } from '../utils/config';

export const revokeTokenAuthorities = async (mintAccount: PublicKey) => {
  await setAuthority(
    connection,
    wallet,
    mintAccount,
    wallet.publicKey,
    AuthorityType.MintTokens,
    null
  );

  await setAuthority(
    connection,
    wallet,
    mintAccount,
    wallet.publicKey,
    AuthorityType.FreezeAccount,
    null
  );
};
