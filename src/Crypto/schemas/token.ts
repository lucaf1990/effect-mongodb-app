import { Schema as S } from "effect";
import { Email } from "../../Schemas/Common/email.js";

export type Token = typeof Token.Type;
export const Token = S.Struct({
  iss: S.String,
  type: S.Literal("access", "refresh"),
  iat: S.Int,
  sub: Email,
  exp: S.Int,
  maxAge: S.Int,
});

export type AccessTokenSchema = typeof AccessTokenSchema.Type;
export const AccessTokenSchema = S.extend(
  Token,
  S.Struct({
    type: S.Literal("access"),
  }),
);

export type RefreshTokenSchema = typeof RefreshTokenSchema.Type;
export const RefreshTokenSchema = S.extend(
  Token,
  S.Struct({
    type: S.Literal("refresh"),
  }),
);
