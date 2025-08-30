import { Effect, Schema } from "effect";
import { SignJWT, jwtVerify } from "jose";

import { ConfigService } from "../../Configuration/configurationService.js";
import {
  AccessTokenGenerationError,
  EmailVerificationTokenGenerationError,
  RefreshTokenGenerationError,
  VerifyTokenError,
} from "../errors/tokenErrors.js";
import type { Token } from "../schemas/token.js";
import { Account } from "../../Account/schemas/account.js";
import { SignUp } from "../../Account/schemas/signUp.js";
import { Email } from "../../Schemas/Common/email.js";
import { Role } from "../../Invitation/schemas/invitation.js";

type TokenType = typeof TokenType.Type;
const TokenType = Schema.Literal(
  "access",
  "refresh",
  "emailVerification",
  "invitation",
);

type TokenConfig = typeof TokenConfig.Type;
const TokenConfig = Schema.Struct({
  type: TokenType,
  expirationTime: Schema.String,
  errorClass: Schema.Any,
});

export class TokenService extends Effect.Service<TokenService>()(
  "TokenService",
  {
    effect: Effect.gen(function* () {
      const configService = yield* ConfigService;
      const { host } = configService;
      const jwtSecret = yield* configService.jwtSecret;
      const secret = new TextEncoder().encode(jwtSecret);

      const tokenConfigs: Record<TokenType, TokenConfig> = {
        access: {
          type: "access",
          expirationTime: "1day",
          errorClass: AccessTokenGenerationError,
        },
        refresh: {
          type: "refresh",
          expirationTime: "7days",
          errorClass: RefreshTokenGenerationError,
        },
        emailVerification: {
          type: "emailVerification",
          expirationTime: "1hour",
          errorClass: EmailVerificationTokenGenerationError,
        },
        invitation: {
          type: "invitation",
          expirationTime: "7days",
          errorClass: EmailVerificationTokenGenerationError,
        },
      };

      const generateToken = (
        target: Account | SignUp | { email: Email },
        tokenType: TokenType,
      ) => {
        const config = tokenConfigs[tokenType];

        return Effect.gen(function* () {
          const token = yield* Effect.tryPromise({
            try: () =>
              new SignJWT({
                type: config.type,
              })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setIssuer(host)
                .setSubject(target.email)
                .setExpirationTime(config.expirationTime)
                .sign(secret),
            catch: () => new config.errorClass(),
          });
          return token;
        });
      };

      const generateAccessToken = (target: Account) =>
        generateToken(target, "access");

      const generateRefreshToken = (target: Account) =>
        generateToken(target, "refresh");

      const generateEmailVerificationToken = (target: SignUp) =>
        generateToken(target, "emailVerification");

      const verifyToken = (serializedToken: string) =>
        Effect.gen(function* () {
          const decoded = yield* Effect.tryPromise({
            try: () => {
              return jwtVerify(serializedToken, secret, {
                issuer: host,
              });
            },
            catch: () => new VerifyTokenError(),
          });
          return decoded.payload as Token;
        });

      const generateInvitationToken = (target: { email: Email; role?: Role }) =>
        Effect.gen(function* () {
          const config = tokenConfigs["invitation"];

          const token = yield* Effect.tryPromise({
            try: () =>
              new SignJWT({
                type: config.type,
                role: target.role || Role.literals[2], // Include role in token payload
              })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setIssuer(host)
                .setSubject(target.email)
                .setExpirationTime(config.expirationTime)
                .sign(secret),
            catch: () => new config.errorClass(),
          });
          return token;
        });

      return {
        generateAccessToken,
        generateRefreshToken,
        generateEmailVerificationToken,
        generateInvitationToken,
        verifyToken,
      } as const;
    }),
    dependencies: [ConfigService.Default],
  },
) {}
