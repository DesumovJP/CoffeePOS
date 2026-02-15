export default {
  routes: [
    {
      method: 'POST',
      path: '/tasks/:id/complete',
      handler: 'task.complete',
      config: {
        policies: [],
      },
    },
  ],
};
