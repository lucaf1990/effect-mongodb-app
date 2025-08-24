import { Effect, Schema } from "effect";
import * as nodemailer from "nodemailer";
import { ConfigService } from "../Configuration/configurationService.js";
import { renderTemplate } from "../Templates/Utils.js";

export class EmailService extends Effect.Service<EmailService>()(
  "EmailService",
  {
    effect: Effect.gen(function* () {
      const configuration = yield* ConfigService;

      type SendEmailParams = typeof SendEmailParams.Type;
      const SendEmailParams = Schema.Struct({
        to: Schema.String,
        subject: Schema.String,
        templateName: Schema.String,
        templateParams: Schema.Record({
          key: Schema.String,
          value: Schema.Unknown,
        }),
      });

      const createTransporter = Effect.gen(function* () {
        const emailHost = configuration.emailHost;
        const emailPort = configuration.emailPort;
        const emailUser = configuration.emailUser;
        const emailPass = configuration.emailPass;

        const configurationValues = {
          host: emailHost,
          port: emailPort,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        };

        return yield* Effect.try({
          try: () =>
            nodemailer.createTransport(
              configurationValues as nodemailer.TransportOptions,
            ),
          catch: (error) =>
            new Error(`Could not create email transporter: ${String(error)}`),
        });
      });

      const sendEmail = (params: SendEmailParams) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("email", {
            email: params.to,
            subject: params.subject,
            templateName: params.templateName,
          });

          // Get transporter
          const transporter = yield* createTransporter;

          const stringParams = Object.entries(params.templateParams).reduce(
            (acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            },
            {} as Record<string, string>,
          );

          const html = yield* renderTemplate(params.templateName, stringParams);

          const fromEmail = configuration.emailFromAddress;

          return yield* Effect.tryPromise({
            try: () =>
              transporter.sendMail({
                from: fromEmail,
                to: params.to,
                subject: params.subject,
                html,
              }),
            catch: (error) =>
              new Error(`Failed to send email: ${String(error)}`),
          });
        });

      return {
        sendEmail,
      };
    }),
    dependencies: [ConfigService.Default],
  },
) {}
