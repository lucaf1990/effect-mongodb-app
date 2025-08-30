import { Schema as S } from "effect";
import { ObjectId } from "mongodb";
import { AccountId } from "../../Account/schemas/account.js";
import { Email } from "../../Schemas/Common/email.js";
import { HttpApiSchema } from "@effect/platform";

// Define the Role type that matches Account schema
export const Role = S.Literal(
  "admin",
  "moderator",
  "user",
  "notAllowed",
).annotations({
  examples: ["user"],
  identifier: "Role",
});
export type Role = typeof Role.Type;

export type InvitationId = typeof InvitationId.Type;
export const InvitationId = S.instanceOf(ObjectId)
  .pipe(S.brand("InvitationId"))
  .annotations({
    jsonSchema: { type: "string" },
  });

export type Invitation = typeof Invitation.Type;
export const Invitation = S.Struct({
  _id: InvitationId,
  senderId: AccountId,
  token: S.Redacted(S.String),
  recipientEmail: Email,
  intendedRole: Role.pipe(
    S.propertySignature,
    S.withConstructorDefault(() => "user" as const),
  ),
  status: S.Literal("pending", "accepted", "declined").pipe(
    S.propertySignature,
    S.withConstructorDefault(() => "pending" as const),
  ),
  createdAt: S.DateFromString,
  updatedAt: S.DateFromString,
});

export class InvitationNotFound extends S.TaggedError<InvitationNotFound>()(
  "InvitationNotFound",
  {
    message: S.NullishOr(S.String),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class InvalidInvitationToken extends S.TaggedError<InvalidInvitationToken>()(
  "InvalidInvitationToken",
  {
    message: S.NullishOr(S.String),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}
