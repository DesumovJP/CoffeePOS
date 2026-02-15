'use strict';

/**
 * CoffeePOS - Database Index Migration
 *
 * Adds indexes on frequently queried columns for better query performance.
 * - orders: status, created_at (filtering by status, sorting by date)
 * - ingredients: is_active (active ingredient filtering)
 * - inventory_transactions: type, created_at (transaction lookups)
 */

async function up(knex) {
  // Order indexes
  if (await knex.schema.hasTable('orders')) {
    await knex.schema.alterTable('orders', (table) => {
      table.index('status');
      table.index('created_at');
    });
  }

  // Ingredient indexes
  if (await knex.schema.hasTable('ingredients')) {
    await knex.schema.alterTable('ingredients', (table) => {
      table.index('is_active');
    });
  }

  // Inventory transaction indexes
  if (await knex.schema.hasTable('inventory_transactions')) {
    await knex.schema.alterTable('inventory_transactions', (table) => {
      table.index('type');
      table.index('created_at');
    });
  }
}

async function down(knex) {
  if (await knex.schema.hasTable('orders')) {
    await knex.schema.alterTable('orders', (table) => {
      table.dropIndex('status');
      table.dropIndex('created_at');
    });
  }

  if (await knex.schema.hasTable('ingredients')) {
    await knex.schema.alterTable('ingredients', (table) => {
      table.dropIndex('is_active');
    });
  }

  if (await knex.schema.hasTable('inventory_transactions')) {
    await knex.schema.alterTable('inventory_transactions', (table) => {
      table.dropIndex('type');
      table.dropIndex('created_at');
    });
  }
}

module.exports = { up, down };
