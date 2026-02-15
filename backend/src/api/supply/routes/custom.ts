export default {
  routes: [
    {
      method: 'POST',
      path: '/supplies/:id/receive',
      handler: 'supply.receive',
      config: {
        policies: [],
      },
    },
  ],
};
