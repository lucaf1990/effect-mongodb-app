import { Context, Schema as S } from "effect";
import { ObjectId } from "mongodb";
import { Email, Password } from "../../Schemas/Common/email.js";

export type AccountId = typeof AccountId.Type;
export const AccountId = S.instanceOf(ObjectId)
  .pipe(S.brand("AccountId"))
  .annotations({
    jsonSchema: { type: "string" },
  });

export type Account = S.Schema.Type<typeof Account>;
export const Account = S.Struct({
  _id: S.optional(AccountId),
  firstName: S.String,
  lastName: S.String,
  username: S.NullOr(S.String),
  dateOfBirth: S.NullishOr(S.Date),
  phoneNumber: S.NullOr(S.String),
  profileImageUrl: S.NullishOr(S.String),
  bio: S.NullishOr(S.String),
  externalUrls: S.NullishOr(S.Array(S.String)),
  isEmailVerified: S.NullishOr(S.Boolean),
  isPrivate: S.NullishOr(S.Boolean),
  role: S.Literal("admin", "moderator", "user", "notAllowed").pipe(
    S.annotations({
      default: "user",
    }),
  ),
  email: Email,
  passwordHash: Password, // Sensitive
  passwordSalt: Password, // Sensitive
  createdAt: S.Date,
  updatedAt: S.Date,
});
export class CurrentAccount extends Context.Tag("CurrentAccount")<
  CurrentAccount,
  Account
>() { }

export type AccountVerification = typeof AccountVerification.Type;
export const AccountVerification = S.Struct({
  _id: S.optional(AccountId),
  email: Email,
  isSent: S.Boolean,
  verificationCode: S.Redacted(S.String),
  isVerified: S.Boolean,
  validUntil: S.Date,
  createdAt: S.Date,
  updatedAt: S.Date,
});
