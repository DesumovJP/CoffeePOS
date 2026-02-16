export default ({ env }) => {
  const isProduction = env('NODE_ENV') === 'production';
  const databaseUrl = env('DATABASE_URL');

  const ssl = isProduction ? true : env.bool('DATABASE_SSL', false);
  const rejectUnauthorized = env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false);

  const connection = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: ssl && { rejectUnauthorized },
      }
    : {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: ssl && { rejectUnauthorized },
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  return {
    connection: {
      client: 'postgres',
      connection,
      pool: {
        min: env.int('DATABASE_POOL_MIN', isProduction ? 0 : 2),
        max: env.int('DATABASE_POOL_MAX', isProduction ? 5 : 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
