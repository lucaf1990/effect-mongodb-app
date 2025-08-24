import { Effect, Redacted } from "effect";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { CryptoErrors } from "../errors/cryptoErrors.js";
import { Password } from "../../Schemas/Common/email.js";
import { NodeContext } from "@effect/platform-node";

export class CryptoService extends Effect.Service<CryptoService>()(
  "CryptoService",
  {
    effect: Effect.gen(function* () {
      const hashPassword = function (
        password: string,
        salt: string,
      ): Effect.Effect<Password, unknown, never> {
        return Effect.tryPromise({
          try: async () => {
            const hash = await argon2.hash(password + salt, {
              type: argon2.argon2id,
              memoryCost: 2 ** 16,
              timeCost: 3,
              parallelism: 1,
            });
            return Redacted.make(hash) as Password;
          },
          catch: (e) => CryptoErrors.hashingPassword({ error: e }),
        });
      };

      const verifyPassword = function (
        hash: Password,
        password: string,
        salt: string,
      ) {
        return Effect.tryPromise({
          try: () => argon2.verify(Redacted.value(hash), password + salt),
          catch: (e) => CryptoErrors.hashingPassword({ error: e }),
        });
      };

      const getRandomSalt = function (size = 16) {
        return Effect.try({
          try: () => crypto.randomBytes(size).toString("hex"),
          catch: (e) => CryptoErrors.generatingSalt(e),
        });
      };

      return {
        hashPassword,
        verifyPassword,
        getRandomSalt,
      } as const;
    }),
    dependencies: [NodeContext.layer],
  },
) { }
