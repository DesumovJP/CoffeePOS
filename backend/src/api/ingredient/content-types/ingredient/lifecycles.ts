export default {
  async afterUpdate(event) {
    const { result } = event;

    if (result.quantity !== undefined && result.minQuantity !== undefined) {
      if (result.quantity <= result.minQuantity && result.isActive !== false) {
        (global as any).strapi?.log?.warn(
          `Low stock alert: ${result.name} — ${result.quantity} ${result.unit} (min: ${result.minQuantity})`
        );
      }
    }
  },
};
