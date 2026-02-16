export default ({ env }) => ({
  upload: {
    config: {
      provider: env('DO_SPACE_BUCKET') ? '@strapi/provider-upload-aws-s3' : 'local',
      providerOptions: env('DO_SPACE_BUCKET')
        ? {
            s3Options: {
              credentials: {
                accessKeyId: env('DO_SPACE_ACCESS_KEY'),
                secretAccessKey: env('DO_SPACE_SECRET_KEY'),
              },
              endpoint: `https://${env('DO_SPACE_ENDPOINT')}`,
              region: 'us-east-1',
              forcePathStyle: false,
              params: {
                Bucket: env('DO_SPACE_BUCKET'),
                ACL: 'public-read',
              },
            },
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
