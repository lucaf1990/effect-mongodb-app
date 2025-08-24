import { HttpApiSchema } from "@effect/platform";
import { Effect, Predicate, Schema as S } from "effect";
import { AccountId, CurrentAccount } from "../../Account/schemas/account.js";

export class Forbidden extends S.TaggedError<Forbidden>()(
  "Forbidden",
  {
    accountId: S.optional(AccountId),
    entity: S.String,
    action: S.String,
    cause: S.NullishOr(S.String),
  },
  HttpApiSchema.annotations({ status: 403 }),
) {
  get message() {
    return `Actor (${this.accountId}) is not authorized to perform action "${this.action}" on entity "${this.entity}"`;
  }

  static is(u: unknown): u is Forbidden {
    return Predicate.isTagged(u, "Forbidden");
  }

  static refail(entity: string, action: string) {
    return <A, E extends Forbidden, R>(
      effect: Effect.Effect<A, E, R>,
    ): Effect.Effect<A, Forbidden, CurrentAccount | R> =>
      Effect.catchIf(
        effect,
        (e) => !Forbidden.is(e),
        () =>
          Effect.flatMap(
            CurrentAccount,
            (actor) =>
              new Forbidden({
                accountId: actor._id,
                entity,
                action,
                cause: null,
              }),
          ),
      );
  }
}
