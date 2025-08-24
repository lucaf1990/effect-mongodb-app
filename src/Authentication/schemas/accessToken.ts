import { Redacted, Schema as S } from "effect";

export const AccessTokenString = S.String.pipe(S.brand("AccessToken"));
export const AccessToken = S.Redacted(AccessTokenString);
export type AccessToken = typeof AccessToken.Type;

export const accessTokenFromString = (token: string): AccessToken =>
  Redacted.make(AccessTokenString.make(token));

export const accessTokenFromRedacted = (
  token: Redacted.Redacted,
): AccessToken => token as AccessToken;
