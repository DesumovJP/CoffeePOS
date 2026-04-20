export default {
  routes: [
    {
      method: 'GET',
      path: '/products/availability',
      handler: 'product.getAvailability',
      config: {
        policies: [],
      },
    },
  ],
};
