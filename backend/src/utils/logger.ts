/**
 * CoffeePOS - Structured Logger
 *
 * Wraps strapi.log with contextual prefixes for better traceability.
 * Each logger instance is scoped to a module/context name.
 *
 * Usage:
 *   const log = createLogger('OrderService');
 *   log.info('Order created', { orderId: 42 });
 *   // => [OrderService] Order created {"orderId":42}
 */

export interface Logger {
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  debug(message: string, data?: Record<string, any>): void;
}

function formatEntry(message: string, data?: Record<string, any>): string {
  return data ? `${message} ${JSON.stringify(data)}` : message;
}

export function createLogger(context: string): Logger {
  const prefix = `[${context}]`;

  return {
    info(message: string, data?: Record<string, any>) {
      const entry = formatEntry(message, data);
      (global as any).strapi?.log?.info(`${prefix} ${entry}`);
    },

    warn(message: string, data?: Record<string, any>) {
      const entry = formatEntry(message, data);
      (global as any).strapi?.log?.warn(`${prefix} ${entry}`);
    },

    error(message: string, data?: Record<string, any>) {
      const entry = formatEntry(message, data);
      (global as any).strapi?.log?.error(`${prefix} ${entry}`);
    },

    debug(message: string, data?: Record<string, any>) {
      const entry = formatEntry(message, data);
      (global as any).strapi?.log?.debug(`${prefix} ${entry}`);
    },
  };
}
