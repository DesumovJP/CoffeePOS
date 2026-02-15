export default {
  routes: [
    {
      method: 'GET',
      path: '/ingredients/low-stock',
      handler: 'ingredient.getLowStock',
      config: {
        policies: [],
      },
    },
  ],
};
