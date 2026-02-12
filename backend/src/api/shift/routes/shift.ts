import { factories } from '@strapi/strapi';

const coreRouter = factories.createCoreRouter('api::shift.shift');

const customRoutes = {
  routes: [
    {
      method: 'POST',
      path: '/shifts/open',
      handler: 'shift.openShift',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/shifts/:id/close',
      handler: 'shift.closeShift',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/shifts/current',
      handler: 'shift.getCurrentShift',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};

export default [customRoutes, coreRouter];
