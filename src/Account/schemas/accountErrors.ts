import { Schema as S, Schema } from "effect";
import { HttpApiSchema } from "@effect/platform";

import { AccountId } from "./account.js";
import { Email } from "../../Schemas/Common/email.js";

export class AccountNotFound extends S.TaggedError<AccountNotFound>()(
  "AccountNotFound",
  { id: Schema.optional(AccountId) },
  HttpApiSchema.annotations({
    status: 404,
    title: "Account Not Found",
    description: "The account corresponding to the ID does not exist.",
  }),
) {}

export class AccountByEmailNotFound extends S.TaggedError<AccountByEmailNotFound>()(
  "AccountByEmailNotFound",
  { email: Email },
  HttpApiSchema.annotations({
    status: 404,
    title: "Account Not Found",
    description: "The account corresponding to the email does not exist.",
  }),
) {}

export class AccountAlreadyExists extends S.TaggedError<AccountAlreadyExists>()(
  "AccountAlreadyExists",
  { email: Email },
  HttpApiSchema.annotations({
    status: 409,
    title: "Account Already Exists",
    description: "The account already exists.",
  }),
) {}

export class InvalidPassword extends S.TaggedError<InvalidPassword>()(
  "InvalidPassword",
  {},
  HttpApiSchema.annotations({
    status: 400,
    title: "Invalid Password",
    description: "The password is incorrect or the account does not exist.",
  }),
) {}

export class EmailNotVerifiedError extends S.TaggedError<EmailNotVerifiedError>()(
  "EmailNotVerifiedError",
  {
    email: Email,
  },
  HttpApiSchema.annotations({
    status: 400,
    title: "Unverified Email",
    description:
      "The email has not been verified yet. Please verify your email before logging into your account.",
  }),
) {
  // Override the message getter to include the email
  get message() {
    return `The email ${this.email} has not been verified yet. Please verify your email before logging into your account.`;
  }
}
