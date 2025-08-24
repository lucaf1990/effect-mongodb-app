import { HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";

export class AccessTokenGenerationError extends S.TaggedError<AccessTokenGenerationError>()(
  "AccessTokenGenerationError",
  {},
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class RefreshTokenGenerationError extends S.TaggedError<AccessTokenGenerationError>()(
  "RefreshTokenGenerationError",
  {},
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class EmailVerificationTokenGenerationError extends S.TaggedError<AccessTokenGenerationError>()(
  "EmailVerificationTokenGenerationError",
  {},
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class VerifyTokenError extends S.TaggedError<VerifyTokenError>()(
  "VerifyTokenError",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}
