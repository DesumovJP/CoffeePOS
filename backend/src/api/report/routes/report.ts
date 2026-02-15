export default {
  routes: [
    {
      method: 'GET',
      path: '/reports/daily',
      handler: 'report.daily',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reports/monthly',
      handler: 'report.monthly',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reports/products',
      handler: 'report.products',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reports/x-report',
      handler: 'report.xReport',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reports/z-report',
      handler: 'report.zReport',
      config: {
        policies: [],
      },
    },
  ],
};
