import { HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";

export class ServerError extends S.TaggedError<ServerError>()(
  "ServerError",
  {
    message: S.NullishOr(S.String),
  },
  HttpApiSchema.annotations({ status: 500 }),
) {}
