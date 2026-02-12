import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  /**
   * Mark a task as completed
   */
  async complete(ctx) {
    const { id } = ctx.params;
    const { completedBy } = ctx.request.body?.data || {};

    if (!completedBy) {
      return ctx.badRequest('completedBy is required');
    }

    const task = await strapi.db.query('api::task.task').findOne({
      where: { id },
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    if (task.status === 'done') {
      return ctx.badRequest('Task is already completed');
    }

    const updated = await strapi.db.query('api::task.task').update({
      where: { id },
      data: {
        status: 'done',
        completedAt: new Date().toISOString(),
        completedBy,
      },
    });

    return { data: updated };
  },
}));
