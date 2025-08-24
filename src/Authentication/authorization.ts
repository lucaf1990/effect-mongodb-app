/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Effect } from "effect";
import { Forbidden } from "./schemas/forbidden.js";
import { Account, CurrentAccount } from "../Account/schemas/account.js";

export const TypeId: unique symbol = Symbol.for(
  "Domain/Policy/AuthorizedActor",
);
export type TypeId = typeof TypeId;

export interface AuthorizedActor<
  Entity extends string = string,
  Action extends string = string,
> extends Account {
  readonly [TypeId]: {
    readonly _Entity: Entity;
    readonly _Action: Action;
  };
}

export const authorizedActor = (user: Account): AuthorizedActor =>
  user as unknown as AuthorizedActor;
export const policy = <Entity extends string, Action extends string, E, R>(
  entity: Entity,
  action: Action,
  f: (actor: Account) => Effect.Effect<boolean, E, R>,
  cause?: string,
) =>
  Effect.flatMap(CurrentAccount, (actor) => {


    return Effect.flatMap(f(actor), (can) =>
      can
        ? Effect.succeed(
          authorizedActor(actor) as AuthorizedActor<Entity, Action>,
        )
        : Effect.fail(
          new Forbidden({ accountId: actor._id, entity, action, cause }),
        ),
    );
  });

export const policyCompose =
  <E1 extends string, A1 extends string, E, R>(
    that: Effect.Effect<AuthorizedActor<E1, A1>, E, R>,
  ) =>
    <E2 extends string, A2 extends string, E2Err, R2>(
      self: Effect.Effect<AuthorizedActor<E2, A2>, E2Err, R2>,
    ): Effect.Effect<
      AuthorizedActor<E1, A1> | AuthorizedActor<E2, A2>,
      E | Forbidden,
      R | CurrentAccount
    > =>
      Effect.zipRight(self, that) as any;

export const policyUse =
  <E1 extends string, A1 extends string, E, R>(
    policy: Effect.Effect<AuthorizedActor<E1, A1>, E, R>,
  ) =>
    <A, E2, R2>(
      effect: Effect.Effect<A, E2, R2>,
    ): Effect.Effect<A, E | E2, Exclude<R2, AuthorizedActor<E1, A1>> | R> =>
      Effect.zipRight(policy, effect) as any;

export const policyRequire =
  <Entity extends string, Action extends string>(
    _entity: Entity,
    _action: Action,
  ) =>
    <A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ): Effect.Effect<A, E, R | AuthorizedActor<Entity, Action>> =>
      effect;

export const withSystemActor = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, Exclude<R, AuthorizedActor>> => effect as any;
