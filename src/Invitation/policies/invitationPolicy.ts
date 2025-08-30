import { Effect } from "effect";

import { policy } from "../../Authentication/authorization.js";

export class InvitationPolicy extends Effect.Service<InvitationPolicy>()(
  "InvitationPolicy",
  {
    effect: Effect.gen(function* () {
      const canCreate = () =>
        policy("invitation", "create", (actor) => {
          return Effect.succeed(
            actor.role === "admin" || actor.role === "moderator",
          );
        });

      const canRead = () =>
        policy("invitation", "read", (actor) => {
          return Effect.succeed(
            actor.role === "admin" || actor.role === "moderator",
          );
        });

      const canReadAll = () =>
        policy("invitation", "readAll", (actor) =>
          Effect.succeed(actor.role === "admin" || actor.role === "moderator"),
        );

      const canUpdate = () =>
        policy("invitation", "update", (actor) => {
          return Effect.succeed(
            actor.role === "admin" || actor.role === "moderator",
          );
        });

      const canDelete = () =>
        policy("invitation", "delete", (actor) => {
          return Effect.succeed(
            actor.role === "admin" || actor.role === "moderator",
          );
        });

      const canSendInvitation = () =>
        policy("invitation", "send", (actor) => {
          return Effect.succeed(
            actor.role === "admin" || actor.role === "moderator",
          );
        });

      return {
        canCreate,
        canRead,
        canReadAll,
        canUpdate,
        canDelete,
        canSendInvitation,
      } as const;
    }),
    dependencies: [],
  },
) {}
