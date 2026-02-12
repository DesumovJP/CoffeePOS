import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::shift.shift', ({ strapi }) => ({
  /**
   * Add a sale to the current shift totals
   */
  async addSale(shiftId: number, amount: number, paymentMethod: string) {
    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id: shiftId },
    });

    if (!shift) return;

    const updateData: Record<string, number> = {
      totalSales: (shift.totalSales || 0) + amount,
      ordersCount: (shift.ordersCount || 0) + 1,
    };

    if (paymentMethod === 'cash') {
      updateData.cashSales = (shift.cashSales || 0) + amount;
    } else {
      updateData.cardSales = (shift.cardSales || 0) + amount;
    }

    await strapi.db.query('api::shift.shift').update({
      where: { id: shiftId },
      data: updateData,
    });
  },

  /**
   * Add writeoff total to the shift
   */
  async addWriteOff(shiftId: number, amount: number) {
    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id: shiftId },
    });

    if (!shift) return;

    await strapi.db.query('api::shift.shift').update({
      where: { id: shiftId },
      data: {
        writeOffsTotal: (shift.writeOffsTotal || 0) + amount,
      },
    });
  },

  /**
   * Add supply total to the shift
   */
  async addSupply(shiftId: number, amount: number) {
    const shift = await strapi.db.query('api::shift.shift').findOne({
      where: { id: shiftId },
    });

    if (!shift) return;

    await strapi.db.query('api::shift.shift').update({
      where: { id: shiftId },
      data: {
        suppliesTotal: (shift.suppliesTotal || 0) + amount,
      },
    });
  },
}));
