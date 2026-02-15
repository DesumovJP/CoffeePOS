export default {
  routes: [
    {
      method: 'PUT',
      path: '/orders/:id/status',
      handler: 'order.updateStatus',
      config: {
        policies: [],
      },
    },
  ],
};
