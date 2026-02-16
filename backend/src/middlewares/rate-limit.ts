const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

module.exports = (config: { windowMs?: number; max?: number; message?: string }, { strapi }) => {
  const windowMs = config.windowMs || 60000; // 1 minute
  const max = config.max || 100;
  const message = config.message || 'Too many requests, please try again later';

  return async (ctx, next) => {
    const ip = ctx.request.ip;
    const key = `${ip}:${ctx.request.path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > max) {
      ctx.status = 429;
      ctx.body = { error: { status: 429, name: 'TooManyRequestsError', message } };
      return;
    }

    await next();
  };
};
