export default {
  routes: [
    {
      method: 'POST',
      path: '/shifts/open',
      handler: 'shift.openShift',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/shifts/:id/close',
      handler: 'shift.closeShift',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/shifts/current',
      handler: 'shift.getCurrentShift',
      config: {
        policies: [],
      },
    },
  ],
};
