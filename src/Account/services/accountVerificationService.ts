import { Effect, Option } from "effect";
import { AccountVerification } from "../schemas/account.js";
import { AccountVerificationRepository } from "../repositories/accountVerificationRepository.js";
import { AccountNotFound } from "../schemas/accountErrors.js";
import { DatabaseService } from "../../Config/db.js";
import { Email } from "../../Schemas/Common/email.js";

export class AccountVerificationService extends Effect.Service<AccountVerificationService>()(
  "AccountVerificationService",
  {
    effect: Effect.gen(function* () {
      const accountVerificationRepo = yield* AccountVerificationRepository;

      const insert = (data: AccountVerification) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account_verification", data);
          const result = yield* accountVerificationRepo.insert(data);
          return result;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountService.insertAccountVerification", {
            attributes: { data },
          }),
        );

      const findAccountVerificationByEmail = (email: Email) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account_verification", email);
          const account = yield* accountVerificationRepo.findByEmail(email);
          const matched = yield* Option.match(account, {
            onNone: () => Effect.fail(new AccountNotFound()),
            onSome: (account) => Effect.succeed(account),
          });
          return matched;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountService.findAccountByEmail", {
            attributes: { email },
          }),
        );

      const updateByEmail = (
        email: Email,
        data: Partial<AccountVerification>,
      ) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account_verification", email);
          const result = yield* accountVerificationRepo.updateByEmail(
            email,
            data,
          );
          return result;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountService.updateAccountVerificationByEmail", {
            attributes: { email, data },
          }),
        );

      return {
        insert,
        findAccountVerificationByEmail,
        updateByEmail,
      } as const;
    }),
    dependencies: [
      AccountVerificationRepository.Default,
      DatabaseService.Default,
    ],
  },
) {}
