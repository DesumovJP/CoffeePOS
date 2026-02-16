export default ({ env }) => ({
  upload: {
    config: {
      provider: env('DO_SPACE_BUCKET') ? '@strapi/provider-upload-aws-s3' : 'local',
      providerOptions: env('DO_SPACE_BUCKET')
        ? {
            s3Options: {
              credentials: {
                accessKeyId: env('DO_SPACE_KEY'),
                secretAccessKey: env('DO_SPACE_SECRET'),
              },
              endpoint: env('DO_SPACE_ENDPOINT'),
              region: env('DO_SPACE_REGION', 'fra1'),
              forcePathStyle: false,
              params: {
                Bucket: env('DO_SPACE_BUCKET'),
                ACL: 'public-read',
              },
            },
            baseUrl: env('DO_SPACE_CDN', `${env('DO_SPACE_ENDPOINT')}/${env('DO_SPACE_BUCKET')}`),
            rootPath: env('DO_SPACE_ROOT_PATH', 'coffeepos'),
          }
        : {},
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
