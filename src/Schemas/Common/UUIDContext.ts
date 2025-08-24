import { Context, Effect, Layer } from "effect";
import * as uuid from "uuid";

const make = Effect.gen(function* () {
  const generate = Effect.sync(() => uuid.v7());
  return { generate } as const;
});

export class Uuid extends Context.Tag("Uuid")<
  Uuid,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(Uuid, make);
  static Test = Layer.succeed(Uuid, {
    generate: Effect.succeed("test-uuid"),
  });
}
