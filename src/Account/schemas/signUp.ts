import { Redacted, Schema as S } from "effect";
import { Email, Password } from "../../Schemas/Common/email.js";

export type SignUp = typeof SignUp.Type;
export const SignUp = S.Struct({
  email: Email,
  password: Password,
  confirmPassword: Password,
  username: S.String.pipe(
    S.minLength(4),
    S.trimmed(),
    S.annotations({
      title: "Username",
      description: "Username, min length 4 characters",
      default: "user123",
    }),
  ),
}).pipe(
  S.filter((input) => {
    console.log(
      Redacted.value(input.password),
      Redacted.value(input.confirmPassword),
    );
    if (
      Redacted.value(input.password) !== Redacted.value(input.confirmPassword)
    ) {
      return {
        path: ["confirmPassword"],
        message: "Passwords do not match",
      };
    }
    return true;
  }),
  S.annotations({
    title: "Sign Up",
    description: "Sign up for an account",
    jsonSchema: {
      required: ["email", "password", "confirmPassword"],
    },
  }),
);
