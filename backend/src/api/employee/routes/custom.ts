export default {
  routes: [
    {
      method: 'GET',
      path: '/employees/:id/stats',
      handler: 'employee.stats',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/employees/performance',
      handler: 'employee.performance',
      config: {
        policies: [],
      },
    },
  ],
};
