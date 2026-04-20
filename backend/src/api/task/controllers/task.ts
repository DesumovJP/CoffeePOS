import { factories } from '@strapi/strapi';
import { validateRequired, sanitizeString, ValidationError } from '../../../utils/validate';

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('task_create', {
      documentId: entry.documentId,
      title: entry.title,
      priority: entry.priority,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async update(ctx) {
    const response = await super.update(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('task_update', {
      documentId: entry.documentId,
      title: entry.title,
      status: entry.status,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async delete(ctx) {
    const existing: any = await strapi.db
      .query('api::task.task')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.delete(ctx);
    await strapi.service('api::shift.shift').logCurrentShiftActivity('task_delete', {
      documentId: ctx.params.id,
      title: existing?.title,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },

  async complete(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body?.data || {};
    const { completedBy, completionNote, duration, completionPhotoId } = body;

    try {
      validateRequired({ completedBy }, ['completedBy']);
      if (typeof completedBy !== 'string') {
        throw new ValidationError('completedBy must be a string', { completedBy: 'Must be a string' });
      }
      if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
        throw new ValidationError('duration must be a non-negative integer', { duration: 'Invalid' });
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

    if (!task) return ctx.notFound('Task not found');
    if (task.status === 'done') return ctx.badRequest('Task is already completed');

    const updateData: Record<string, unknown> = {
      status: 'done',
      completedAt: new Date().toISOString(),
      completedBy: sanitizeString(completedBy),
    };

    if (typeof duration === 'number') updateData.duration = Math.round(duration);
    if (completionNote)              updateData.completionNote = sanitizeString(String(completionNote)).substring(0, 1000);
    if (completionPhotoId)           updateData.completionPhoto = completionPhotoId;

    const updated = await strapi.db.query('api::task.task').update({
      where: { documentId: id },
      data: updateData,
      populate: { completionPhoto: true },
    });

    await strapi.service('api::shift.shift').logCurrentShiftActivity('task_complete', {
      documentId: id,
      title: updated.title,
      completedBy: sanitizeString(completedBy),
      duration: typeof duration === 'number' ? Math.round(duration) : undefined,
    });

    return { data: updated };
  },
}));
