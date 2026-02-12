import { factories } from '@strapi/strapi';

const coreRouter = factories.createCoreRouter('api::supply.supply');

const customRoutes = {
  routes: [
    {
      method: 'POST',
      path: '/supplies/:id/receive',
      handler: 'supply.receive',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};

export default [customRoutes, coreRouter];
