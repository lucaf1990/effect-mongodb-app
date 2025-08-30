import { Effect, Option, Redacted } from "effect";
import { ConfigService } from "../../Configuration/configurationService.js";
import { VerifyTokenError } from "../../Crypto/errors/tokenErrors.js";
import { TokenService } from "../../Crypto/services/tokenService.js";
import { EmailService } from "../../Email/emailService.js";
import { Email } from "../../Schemas/Common/email.js";

import { ObjectId } from "mongodb";
import { AccountId } from "../../Account/schemas/account.js";
import { InvitationRepository } from "../repositories/invitationRepository.js";
import {
  Invitation,
  InvitationId,
  InvitationNotFound,
  Role,
} from "../schemas/invitation.js";

// Type for invitation token payload
type InvitationTokenPayload = {
  role?: string;
  type: string;
  sub: string;
  iss: string;
  iat: number;
  exp: number;
};

export class InvitationService extends Effect.Service<InvitationService>()(
  "InvitationService",
  {
    effect: Effect.gen(function* () {
      const tokenService = yield* TokenService;
      const emailService = yield* EmailService;
      const configService = yield* ConfigService;
      const invitationRepo = yield* InvitationRepository;

      const host = configService.host;
      const port = configService.port;

      const createInvitation = (
        email: Email,
        senderId: AccountId,
        intendedRole: Role = "user",
      ) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("invitation", email);

          const invitationToken = yield* tokenService.generateInvitationToken({
            email,
            role: intendedRole,
          });

          yield* emailService.sendEmail({
            to: email,
            subject: "You're invited!",
            templateName: "src/Templates/invitation.html",
            templateParams: {
              invitationToken: encodeURIComponent(invitationToken),
              link: host + port,
              entity: "invitations/accept",
            },
          });
          const invitation = Invitation.make({
            _id: InvitationId.make(new ObjectId()),
            senderId: senderId,
            recipientEmail: email,
            intendedRole: intendedRole,
            token: Redacted.make(invitationToken),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          yield* invitationRepo.insertOne(invitation);
          return invitation;
        }).pipe(
          Effect.withSpan("InvitationService.createInvitation", {
            attributes: { email },
          }),
        );

      const verifyInvitationToken = (
        invitationToken: Redacted.Redacted<string>,
      ) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("invitation", invitationToken);

          const decodedToken = decodeURIComponent(
            Redacted.value(invitationToken),
          );
          const decoded = yield* tokenService.verifyToken(decodedToken);
          const email = decoded.sub;

          const invitation = yield* invitationRepo.findByEmail(email);
          if (Option.isNone(invitation)) {
            return yield* Effect.fail(
              new InvitationNotFound({ message: "Invitation not found" }),
            );
          }
          const storedInvitationToken = Redacted.value(invitation.value.token);

          if (storedInvitationToken === decodedToken) {
            const tokenRole = (decoded as InvitationTokenPayload).role;
            const intendedRole: Role =
              tokenRole === "admin" ||
              tokenRole === "moderator" ||
              tokenRole === "user" ||
              tokenRole === "notAllowed"
                ? tokenRole
                : invitation.value.intendedRole;

            const updateResult = yield* invitationRepo.updateByEmail(email, {
              status: "accepted",
            });

            if (updateResult.acknowledged && updateResult.modifiedCount > 0) {
              const updatedInvitation =
                yield* invitationRepo.findByEmail(email);
              if (Option.isSome(updatedInvitation)) {
                return {
                  ...updatedInvitation.value,
                  intendedRole: intendedRole,
                };
              }
            }

            return {
              ...invitation.value,
              status: "accepted" as const,
              intendedRole: intendedRole,
            };
          }

          return yield* Effect.fail(new VerifyTokenError());
        }).pipe(
          Effect.catchAll(() => {
            return Effect.fail(new VerifyTokenError());
          }),
          Effect.withSpan("InvitationService.verifyInvitationToken", {
            attributes: { invitationToken },
          }),
        );

      const findInvitationByEmail = (email: Email) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("invitation", email);

          const invitation = yield* invitationRepo.findByEmail(email);

          const matched = yield* Option.match(invitation, {
            onNone: () =>
              Effect.fail(
                new InvitationNotFound({
                  message: `No invitation found for email: ${email}`,
                }),
              ),
            onSome: (invitation) => Effect.succeed(invitation),
          });

          return matched;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("InvitationService.findInvitationByEmail", {
            attributes: { email },
          }),
        );

      const findInvitationById = (_id: InvitationId) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("invitation", _id);

          const invitation = yield* invitationRepo.findById(_id);

          const matched = yield* Option.match(invitation, {
            onNone: () =>
              Effect.fail(
                new InvitationNotFound({
                  message: `No invitation found for id: ${_id}`,
                }),
              ),
            onSome: (invitation) => Effect.succeed(invitation),
          });

          return matched;
        }).pipe(
          Effect.catchTags({
            InvitationNotFound: () =>
              Effect.fail(
                new InvitationNotFound({
                  message: `No invitation found for id: ${_id}`,
                }),
              ),
          }),
          Effect.withSpan("AccountService.findAccountById", {
            attributes: { _id },
          }),
        );

      const getAllInvitations = (accountId: AccountId) =>
        Effect.gen(function* () {
          return yield* invitationRepo.getAllInvitations();
        }).pipe(
          Effect.withSpan("InvitationService.getAllInvitations", {
            attributes: { accountId },
          }),
        );

      const deleteInvitation = (_id: InvitationId) =>
        Effect.gen(function* () {
          const maybeInvitation = yield* invitationRepo.deleteById(_id);
          if (maybeInvitation.deletedCount > 0) {
            return {
              success: true,
              message: "Invitation deleted successfully",
            };
          } else {
            return { success: false, message: "Invitation not found" };
          }
        }).pipe(
          Effect.withSpan("InvitationService.deleteInvitation", {
            attributes: { _id },
          }),
          Effect.orDie,
        );

      return {
        createInvitation,
        verifyInvitationToken,
        findInvitationByEmail,
        findInvitationById,
        getAllInvitations,
        deleteInvitation,
      } as const;
    }),
    dependencies: [
      TokenService.Default,
      EmailService.Default,
      ConfigService.Default,
      InvitationRepository.Default,
    ],
  },
) {}
