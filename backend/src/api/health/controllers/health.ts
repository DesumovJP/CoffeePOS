export default {
  async check(ctx) {
    const strapi = (global as any).strapi;
    let dbStatus = 'disconnected';

    try {
      await strapi.db.query('api::category.category').count();
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    ctx.body = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbStatus,
      uptime: process.uptime(),
    };
  },
};
