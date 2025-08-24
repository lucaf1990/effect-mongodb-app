import { HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";

export class GeneratingSaltError extends S.TaggedError<GeneratingSaltError>()(
  "GeneratingSaltError",
  {
    error: S.optional(S.Unknown),
  },
  HttpApiSchema.annotations({ status: 500 }),
) {
  get formattedMessage(): string {
    if (this.error instanceof Error) {
      return `${this.message}: ${this.error.message}`;
    }
    return this.message;
  }

  static create(error?: unknown): GeneratingSaltError {
    return new GeneratingSaltError({ error });
  }
}

export class HashingPasswordError extends S.TaggedError<HashingPasswordError>()(
  "HashingPasswordError",
  {
    error: S.optional(S.Unknown),
  },
  HttpApiSchema.annotations({ status: 500 }),
) {
  get message(): string {
    if (this.error instanceof Error) {
      return `Failed to hash password ${this.error.message}`;
    }
    return `Failed to hash password`;
  }

  static create(options: { error?: unknown } = {}): HashingPasswordError {
    return new HashingPasswordError(options);
  }
}

export const CryptoErrors = {
  generatingSalt: (error?: unknown) => GeneratingSaltError.create(error),

  hashingPassword: (options: { error?: unknown } = {}) =>
    HashingPasswordError.create(options),
};
