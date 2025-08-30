import { Effect, Option, pipe } from "effect";
import { Collection, Db, FindCursor } from "effect-mongodb";
import { DatabaseService } from "../../Config/db.js";

import { Email } from "../../Schemas/Common/email.js";
import {
  Invitation,
  InvitationId,
  InvitationNotFound,
} from "../schemas/invitation.js";

export class InvitationRepository extends Effect.Service<InvitationRepository>()(
  "InvitationRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      const sourceCollection = Db.collection(db, "invitation", Invitation);
      const destinationCollection = Db.collection(
        db,
        "invitation_backup",
        Invitation,
      );

      const insertOne = (invitation: Invitation) =>
        Effect.gen(function* () {
          yield* Collection.insertOne(sourceCollection, invitation);
          return invitation;
        }).pipe(Effect.withSpan("InvitationRepository.insertOne"));

      const findById = (_id: InvitationId) =>
        Effect.gen(function* () {
          return yield* Collection.findOne(sourceCollection, { _id });
        }).pipe(Effect.orDie, Effect.withSpan("InvitationRepository.findById"));

      const getAllInvitations = () =>
        Effect.gen(function* () {
          const cursor = Collection.find(sourceCollection, {});
          return yield* FindCursor.toArray(cursor);
        }).pipe(
          Effect.orDie,
          Effect.withSpan("InvitationRepository.getAllInvitations"),
        );

      const updateByEmail = (email: Email, update: Partial<Invitation>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { recipientEmail: email },
            [{ $set: { ...update } }],
          );
          return result;
        }).pipe(Effect.withSpan("InvitationRepository.updateByEmail"));

      const findByEmail = (recipientEmail: Email) =>
        Effect.gen(function* () {
          return yield* Collection.findOne(sourceCollection, {
            recipientEmail,
          });
        }).pipe(
          Effect.orDie,
          Effect.withSpan("InvitationRepository.findByEmail"),
        );

      const updateById = (_id: InvitationId, update: Partial<Invitation>) =>
        Effect.gen(function* () {
          const result = yield* Collection.updateMany(
            sourceCollection,
            { _id },
            [{ $set: { ...update } }],
          );
          return result.modifiedCount > 0;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("InvitationRepository.updateById"),
        );

      const deleteById = (_id: InvitationId) =>
        Effect.gen(function* () {
          return yield* Collection.deleteOne(sourceCollection, { _id });
        });

      const clearAll = () =>
        Effect.gen(function* () {
          yield* Collection.deleteMany(sourceCollection, {});
          yield* Collection.deleteMany(destinationCollection, {});
        });

      const with_ = <A, E, R>(
        _id: InvitationId,
        f: (invitation: Invitation) => Effect.Effect<A, E, R>,
      ): Effect.Effect<A, E | InvitationNotFound, R> => {
        return pipe(
          Effect.succeed(_id),
          Effect.flatMap(() => findById(_id)),
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.fail(
                  new InvitationNotFound({
                    message: `Invitation not found with id: ${_id}`,
                  }),
                ),
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
        getAllInvitations,
        deleteById,
        clearAll,
        updateById,
        findByEmail,
        updateByEmail,
        with_,
      } as const;
    }),
    dependencies: [DatabaseService.Default],
  },
) {}
