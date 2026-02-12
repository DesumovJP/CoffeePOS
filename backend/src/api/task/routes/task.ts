import { factories } from '@strapi/strapi';

const coreRouter = factories.createCoreRouter('api::task.task');

const customRoutes = {
  routes: [
    {
      method: 'POST',
      path: '/tasks/:id/complete',
      handler: 'task.complete',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};

export default [customRoutes, coreRouter];
