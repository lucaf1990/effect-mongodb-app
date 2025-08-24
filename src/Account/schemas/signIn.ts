import { Schema as S } from "effect";
import { Email, Password } from "../../Schemas/Common/email.js";

export const SignIn = S.Struct({
  email: Email,
  password: Password,
});

export type SignIn = typeof SignIn.Type;
