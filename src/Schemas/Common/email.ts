import { Schema as S } from "effect";

export type Email = typeof Email.Type;
export const Email = S.NonEmptyString.pipe(
  S.trimmed(),
  S.pattern(
    /^(?!\.)(?!.*\.\.)([A-Z0-9_+-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i,
  ),
  S.annotations({
    title: "Email",
    description: "An email address",
    default: "test@test.com",
    examples: ["test@test.com"],
  }),
  S.brand("Email"),
);

export type Password = typeof Password.Type;
export const Password = S.Redacted(
  S.NonEmptyString.pipe(
    S.annotations({
      title: "Password",
      description: "A password",
      default: "$Tr0ngPsw!",
    }),
    S.minLength(8),
    S.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    ),
  ),
);
