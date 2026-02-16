export default ({ env }) => {
  const cdnUrl = env('DO_SPACE_CDN', '');

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': [
              "'self'",
              'data:',
              'blob:',
              'https://market-assets.strapi.io',
              ...(cdnUrl ? [cdnUrl] : []),
            ],
            'media-src': [
              "'self'",
              'data:',
              'blob:',
              ...(cdnUrl ? [cdnUrl] : []),
            ],
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        origin: env('FRONTEND_URL', 'http://localhost:3000').split(','),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        keepHeaderOnError: true,
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
