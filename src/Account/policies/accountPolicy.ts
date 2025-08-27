import { Effect } from "effect";

import type { AccountId } from "../schemas/account.js";
import { AccountRepository } from "../repositories/accountRepository.js";
import { policy } from "../../Authentication/authorization.js";

export class AccountPolicy extends Effect.Service<AccountPolicy>()(
  "AccountPolicy",
  {
    effect: Effect.gen(function* () {
      const accountRepo = yield* AccountRepository;

      const canUpdate = (toUpdate: AccountId) =>
        policy("account", "update", (actor) => {
          return Effect.succeed(
            actor._id?.toString() === toUpdate.toString() ||
              actor.role === "admin" ||
              actor.role === "moderator",
          );
        });

      const canRead = (toRead: AccountId) =>
        policy(
          "account",
          "read",
          (actor) =>
            Effect.gen(function* () {
              if (
                actor._id?.toString() === toRead.toString() ||
                actor.role === "admin" ||
                actor.role === "moderator"
              ) {
                return yield* Effect.succeed(true);
              }
              const isPrivate = yield* accountRepo.with_(toRead, (account) =>
                Effect.succeed(account.isPrivate),
              );

              if (isPrivate) {
                return yield* Effect.succeed(false);
              }

              return false;
            }),
          "The target account is private or you do not have valid permissions.",
        );

      const canReadSensitive = (toRead: AccountId) =>
        policy("account", "readSensitive", (actor) =>
          Effect.succeed(
            actor._id.toString() === toRead.toString() ||
              actor.role === "admin",
          ),
        );

      const canReadAllAccounts = () =>
        policy("account", "readAll", (actor) =>
          Effect.succeed(actor.role === "admin" || actor.role === "moderator"),
        );

      const canDeleteAccount = (toDelete: AccountId) =>
        policy("account", "delete", (actor) =>
          Effect.succeed(
            actor._id.toString() === toDelete.toString() ||
              actor.role === "admin" ||
              actor.role === "moderator",
          ),
        );

      return {
        canUpdate,
        canRead,
        canReadSensitive,
        canReadAllAccounts,
        canDeleteAccount,
      } as const;
    }),
    dependencies: [AccountRepository.Default],
  },
) {}
