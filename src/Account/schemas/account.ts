import { Context, Schema as S, Redacted } from "effect";
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
  invitedBy: S.optional(AccountId),
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
}).annotations({
  identifier: "Account",
  examples: [
    {
      _id: AccountId.make(new ObjectId("64b8f8f8f8f8f8f8f8f8f8f8")),
      invitedBy: AccountId.make(new ObjectId("64b8f8f8f8f8f8f8f8f8f8f7")),
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      dateOfBirth: new Date("1990-01-01"),
      phoneNumber: "123-456-7890",
      profileImageUrl: "https://example.com/profile.jpg",
      bio: "Software developer",
      externalUrls: ["https://github.com/johndoe"],
      isEmailVerified: true,
      isPrivate: false,
      role: "user",
      email: Email.make("john.doe@example.com"),
      passwordHash: Redacted.make("hashed_password"),
      passwordSalt: Redacted.make("salt"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
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
