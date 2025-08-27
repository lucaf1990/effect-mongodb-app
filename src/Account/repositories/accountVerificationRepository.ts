import { Effect } from "effect";
import { Collection, Db } from "effect-mongodb";
import { AccountVerification } from "../schemas/account.js";
import { DatabaseService } from "../../Config/db.js";
import { Email } from "../../Schemas/Common/email.js";

export class AccountVerificationRepository extends Effect.Service<AccountVerificationRepository>()(
  "AccountVerificationRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      const collection = Db.collection(
        db,
        "account_verification",
        AccountVerification,
      );

      const insert = (data: Omit<AccountVerification, "_id">) =>
        Collection.insertOne(collection, data).pipe(
          Effect.orDie,
          Effect.withSpan("AccountVerificationRepository.insert"),
        );

      const findByEmail = (email: Email) =>
        Collection.findOne(collection, { email }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountVerificationRepository.findByEmail"),
        );

      const updateByEmail = (
        email: Email,
        data: Partial<AccountVerification>,
      ) =>
        Collection.updateMany(collection, { email }, [{ $set: data }]).pipe(
          Effect.orDie,
          Effect.withSpan("AccountVerificationRepository.updateByEmail", {
            attributes: { email, data },
          }),
        );

      const deleteVerificationCodes = () =>
        Collection.deleteMany(collection, { isVerified: true }).pipe(
          Effect.orDie,
          Effect.withSpan(
            "AccountVerificationRepository.deleteUsedVerificationCodes",
          ),
        );

      return {
        insert,
        findByEmail,
        updateByEmail,
        deleteVerificationCodes,
      } as const;
    }),
    dependencies: [DatabaseService.Default],
  },
) {}
