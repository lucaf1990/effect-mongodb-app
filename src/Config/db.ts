import { Effect, Config, Redacted, Console } from "effect";
import { MongoClient } from "effect-mongodb";

export class DatabaseService extends Effect.Service<DatabaseService>()(
  "DatabaseService",
  {
    effect: Effect.gen(function* () {
      const mongoUriRedacted = yield* Config.redacted("MONGO_URI");
      const mongoDb = yield* Config.string("MONGO_DB");

      const mongoUri = Redacted.value(mongoUriRedacted);
      const client = yield* MongoClient.connectScoped(mongoUri);
      const db = MongoClient.db(client, mongoDb);
      yield* Console.log("connected to MongoDB");
      return {
        db,
        getDatabase: () => db,
      } as const;
    }),
    dependencies: [],
  },
) {}
