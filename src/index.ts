import { DevTools } from "@effect/experimental";
import {
  Etag,
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime, NodeSocket } from "@effect/platform-node";
import "dotenv/config";
import { Console, Effect, Layer } from "effect";
import { createServer } from "http";
import { MainServiceApiLive } from "./Api/mainApiLive.js";
import { ConfigService } from "./Configuration/configurationService.js";

const server = HttpApiBuilder.serve(HttpMiddleware.logger)
  .pipe(
    HttpServer.withLogAddress,
    Layer.provide(HttpApiSwagger.layer()),
    Layer.provide(HttpApiBuilder.middlewareOpenApi()),
    Layer.provide(MainServiceApiLive),
    Layer.provide(
      HttpApiBuilder.middlewareCors({
        allowedOrigins: ["*"],
      }),
    ),
    Layer.provide(Etag.layerWeak),
    Layer.provide(
      NodeHttpServer.layer(createServer, {
        port: Effect.runSync(
          Effect.provide(
            Effect.gen(function* () {
              const config = yield* ConfigService;
              return config.port;
            }),
            ConfigService.Default,
          ),
        ),
      }),
    ),
    Layer.launch,
    Effect.provide(
      DevTools.layerWebSocket().pipe(
        Layer.provide(NodeSocket.layerWebSocketConstructor),
      ),
    ),
  )
  .pipe(Effect.catchAll((e) => Console.error(e)));
const runnable = Effect.scoped(server);
NodeRuntime.runMain(runnable);
