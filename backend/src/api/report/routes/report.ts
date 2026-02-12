export default {
  routes: [
    {
      method: 'GET',
      path: '/reports/daily',
      handler: 'report.daily',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/reports/monthly',
      handler: 'report.monthly',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
