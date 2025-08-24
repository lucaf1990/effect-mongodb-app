import { Config, Effect } from "effect";

export class ConfigService extends Effect.Service<ConfigService>()(
  "ConfigService",
  {
    effect: Effect.gen(function* () {
      const port = yield* Config.number("PORT").pipe(Config.withDefault(3000));

      const host = yield* Config.string("HOST").pipe(
        Config.withDefault("http://localhost:"),
      );
      const emailHost = yield* Config.string("EMAIL_HOST").pipe(
        Config.withDefault("smtp.example.com"),
      );
      const emailPort = yield* Config.string("EMAIL_PORT").pipe(
        Config.withDefault("587"),
      );

      const emailUser = yield* Config.string("EMAIL_USER").pipe(
        Config.withDefault("your-email@example.com"),
      );
      const emailPass = yield* Config.string("EMAIL_PASS").pipe(
        Config.withDefault("your-email-password"),
      );
      const emailFromAddress = yield* Config.string("EMAIL_FROM").pipe(
        Config.withDefault("noreply@example.com"),
      );
      const jwtSecret = Config.string("JWT_SECRET").pipe(
        Config.withDefault("secret"),
      );

      return {
        port,
        host,
        jwtSecret,
        emailHost,
        emailPort,
        emailUser,
        emailPass,
        emailFromAddress,
      } as const;
    }),
  },
) {}
