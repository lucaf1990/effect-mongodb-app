import { Effect, Option, pipe } from "effect";
import { Collection, Db, FindCursor } from "effect-mongodb";
import { DatabaseService } from "../../Config/db.js";
import { Account, AccountId } from "../schemas/account.js";
import { AccountNotFound } from "../schemas/accountErrors.js";
import { Email } from "../../Schemas/Common/email.js";

export class AccountRepository extends Effect.Service<AccountRepository>()(
  "AccountRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      const sourceCollection = Db.collection(db, "account", Account);
      const destinationCollection = Db.collection(
        db,
        "account_backup",
        Account,
      );

      const insertOne = (account: Account) =>
        Effect.gen(function* () {
          yield* Collection.insertOne(sourceCollection, account);
          return account;
        }).pipe(Effect.withSpan("AccountRepository.insertOne"));

      const findById = (_id: AccountId) =>
        Effect.gen(function* () {
          return yield* Collection.findOne(sourceCollection, { _id });
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.findById"));

      const getAllAccounts = () =>
        Effect.gen(function* () {
          const cursor = Collection.find(sourceCollection, {});
          return yield* FindCursor.toArray(cursor);
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountRepository.getAllAccounts"),
        );

      const updateByEmail = (email: Email, update: Partial<Account>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { email },
            [{ $set: { ...update } }],
          );
          return result.modifiedCount > 0;
        }).pipe(Effect.withSpan("AccountRepository.updateByEmail"));

      const findByEmail = (email: Email) =>
        Effect.gen(function* () {
          return yield* Collection.findOne(sourceCollection, { email });
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.findByEmail"));

      const updateById = (_id: AccountId, update: Partial<Account>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { _id },
            [{ $set: { ...update } }],
          );
          return result.modifiedCount > 0;
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.updateById"));

      const deleteById = (_id: AccountId) =>
        Effect.gen(function* () {
          return yield* Collection.deleteOne(sourceCollection, { _id });
        });

      const clearAll = () =>
        Effect.gen(function* () {
          yield* Collection.deleteMany(sourceCollection, {});
          yield* Collection.deleteMany(destinationCollection, {});
        });

      const with_ = <A, E, R>(
        _id: AccountId,
        f: (account: Account) => Effect.Effect<A, E, R>,
      ): Effect.Effect<A, E | AccountNotFound, R> => {
        return pipe(
          Effect.succeed(_id),
          Effect.flatMap(() => findById(_id)),
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new AccountNotFound()),
              onSome: Effect.succeed,
            }),
          ),
          Effect.flatMap(f),
          Effect.catchAll((e) => Effect.fail(e as E)),
        );
      };
      return {
        insertOne,
        findById,
        getAllAccounts,
        deleteById,
        clearAll,
        updateById,
        findByEmail,
        with_,
        updateByEmail,
      } as const;
    }),
    dependencies: [DatabaseService.Default],
  },
) {}
