import { factories } from '@strapi/strapi';
import { validateRequired, sanitizeString, ValidationError } from '../../../utils/validate';

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  /**
   * Mark a task as completed
   */
  async complete(ctx) {
    const { id } = ctx.params;
    const { completedBy } = ctx.request.body?.data || {};

    try {
      validateRequired({ completedBy }, ['completedBy']);
      if (typeof completedBy !== 'string') {
        throw new ValidationError('completedBy must be a string', { completedBy: 'Must be a string' });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return ctx.badRequest(error.message, { details: error.details });
      }
      throw error;
    }

    const task = await strapi.db.query('api::task.task').findOne({
      where: { documentId: id },
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    if (task.status === 'done') {
      return ctx.badRequest('Task is already completed');
    }

    const updated = await strapi.db.query('api::task.task').update({
      where: { documentId: id },
      data: {
        status: 'done',
        completedAt: new Date().toISOString(),
        completedBy: sanitizeString(completedBy),
      },
    });

    return { data: updated };
  },
}));
