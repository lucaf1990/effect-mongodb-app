import { HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";

export class Unauthorized extends S.TaggedError<Unauthorized>()(
  "Unauthorized",
  {
    message: S.String,
  },
  HttpApiSchema.annotations({ status: 501 }),
) {}
