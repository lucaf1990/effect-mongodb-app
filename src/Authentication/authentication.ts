import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform";
import { Effect, Layer, Option, Redacted } from "effect";
import { Unauthorized } from "./schemas/unauthorized.js";
import { CurrentAccount } from "../Account/schemas/account.js";
import { TokenService } from "../Crypto/services/tokenService.js";
import { AccountRepository } from "../Account/repositories/accountRepository.js";

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Authentication",
  {
    failure: Unauthorized,
    provides: CurrentAccount,
    security: {
      bearerHeader: HttpApiSecurity.bearer,
    },
  },
) {}

export const AuthenticationLive = Layer.effect(
  Authentication,

  Effect.gen(function* () {
    return Authentication.of({
      bearerHeader: (serializedToken) =>
        Effect.provide(
          Effect.gen(function* () {
            const tokenService = yield* TokenService;
            const accountRepo = yield* AccountRepository;
            const decoded = yield* tokenService.verifyToken(
              Redacted.value(serializedToken),
            );

            const maybeAccount = yield* accountRepo.findByEmail(decoded.sub);

            const account = yield* Option.match(maybeAccount, {
              onNone: () =>
                Effect.fail(
                  new Unauthorized({
                    message: "Token Account not found",
                  }),
                ),
              onSome: (account) => Effect.succeed(account),
            });

            return account;
          }),
          Layer.merge(AccountRepository.Default, TokenService.Default),
        ).pipe(
          Effect.catchAll(() =>
            Effect.fail(
              new Unauthorized({
                message: "Token Account not found",
              }),
            ),
          ),
        ),
    });
  }),
);
