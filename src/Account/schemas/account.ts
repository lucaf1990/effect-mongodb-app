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
  _id: AccountId,
  firstName: S.NullishOr(S.String),
  lastName: S.NullishOr(S.String),
  username: S.NullOr(S.String),
  dateOfBirth: S.NullishOr(S.DateFromString),
  phoneNumber: S.NullOr(S.String),
  profileImageUrl: S.NullishOr(S.String),
  bio: S.NullishOr(S.String),
  externalUrls: S.NullishOr(S.Array(S.String)),
  isEmailVerified: S.Boolean.pipe(
    S.propertySignature,
    S.withConstructorDefault(() => false),
  ),
  isPrivate: S.Boolean.pipe(
    S.propertySignature,
    S.withConstructorDefault(() => false),
  ),
  role: S.Literal("admin", "moderator", "user", "notAllowed").pipe(
    S.propertySignature,
    S.withConstructorDefault(() => "user"),
  ),
  email: Email,
  passwordHash: Password,
  passwordSalt: Password,
  createdAt: S.DateFromString,
  updatedAt: S.DateFromString,
});

export class CurrentAccount extends Context.Tag("CurrentAccount")<
  CurrentAccount,
  Account
>() {}

export type AccountVerification = typeof AccountVerification.Type;
export const AccountVerification = S.Struct({
  _id: S.optional(AccountId),
  email: Email,
  isSent: S.Boolean,
  verificationCode: S.Redacted(S.String),
  isVerified: S.Boolean,
  validUntil: S.DateFromString,
  createdAt: S.DateFromString,
  updatedAt: S.DateFromString,
});
