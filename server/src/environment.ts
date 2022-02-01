import * as t from "io-ts";
import { IntFromString } from "io-ts-types";

export const EnvironmentStructure = t.type({
    SENTRY_DSN: t.string,
    SENTRY_ENVIRONMENT: t.string,
    SERVER_PORT: t.string,
    CORS_ORIGIN: t.string,
    SYNC_SOURCES_AT: t.string,
    BCRYPT_HASH_SALT_ROUNDS: IntFromString,
    JWT_ALGORITHM: t.string,
    JWT_PUBLIC_KEY: t.string,
    JWT_PRIVATE_KEY: t.string,
    JWT_ACCESS_TOKEN_EXPIRES_IN: t.string,
    JWT_REFRESH_TOKEN_EXPIRES_IN: t.string,
});

export type Environment = t.TypeOf<typeof EnvironmentStructure>;
