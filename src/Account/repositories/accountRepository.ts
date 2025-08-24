import { Effect, Option, pipe } from "effect";
import { Collection, Db, FindCursor } from "effect-mongodb";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../../Config/db.js";
import { Account, AccountId } from "../schemas/account.js";
import { AccountNotFound } from "../schemas/accountErrors.js";

export class AccountRepository extends Effect.Service<AccountRepository>()(
  "AccountRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      const sourceCollection = Db.collection(db, "people", Account);
      const destinationCollection = Db.collection(db, "people_backup", Account);

      const insertOne = (account: Omit<Account, "_id">) =>
        Effect.gen(function* () {
          const result = yield* Collection.insertOne(sourceCollection, account);
          return { ...account, _id: result.insertedId } as Account;
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.insertOne"));

      const findById = (_id: ObjectId) =>
        Effect.gen(function* () {
          const result = yield* Collection.findOne(sourceCollection, { _id });
          console.log("result:", result);
          return result ? result : Option.none();
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.findById"));

      const getAllAccounts = () =>
        Effect.gen(function* () {
          const cursor = Collection.find(sourceCollection, {});
          return yield* FindCursor.toArray(cursor);
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountRepository.getAllAccounts"),
        );

      const updateByEmail = (email: string, update: Partial<Account>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { email },
            [{ $set: { ...update, updatedAt: new Date().toISOString() } }],
          );
          return result.modifiedCount > 0;
        }).pipe(Effect.withSpan("AccountRepository.updateByEmail"));

      const findByEmail = (email: string) =>
        Effect.gen(function* () {
          const result = yield* Collection.findOne(sourceCollection, { email });
          return result ? result : Option.none();
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.findByEmail"));

      const updateById = (_id: ObjectId, update: Partial<Account>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { _id },
            [{ $set: { ...update, updatedAt: new Date().toISOString() } }],
          );
          return result.modifiedCount > 0;
        }).pipe(Effect.orDie, Effect.withSpan("AccountRepository.updateById"));

      const deleteById = (_id: ObjectId) =>
        Effect.gen(function* () {
          const result = yield* Collection.deleteOne(sourceCollection, { _id });
          return result.deletedCount > 0;
        });

      const clearAll = () =>
        Effect.gen(function* () {
          yield* Collection.deleteMany(sourceCollection, {});
          yield* Collection.deleteMany(destinationCollection, {});
        });

      const with_ = <A, E, R>(
        _id: AccountId,
        f: (person: Account) => Effect.Effect<A, E, R>,
      ): Effect.Effect<A, E | AccountNotFound, R> => {
        return pipe(
          Effect.try(() => new ObjectId(_id)),
          Effect.flatMap((objectId) => findById(objectId)),
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
) { }
