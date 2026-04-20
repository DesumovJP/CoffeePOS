export type ActivityType =
  | 'order_create'
  | 'order_status'
  | 'order_cancel'
  | 'supply_receive'
  | 'writeoff_create'
  | 'shift_open'
  | 'shift_close'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'modifier_create'
  | 'modifier_update'
  | 'modifier_delete'
  | 'modifier_group_create'
  | 'modifier_group_update'
  | 'modifier_group_delete'
  | 'ingredient_create'
  | 'ingredient_update'
  | 'ingredient_delete'
  | 'ingredient_adjust'
  | 'ingredient_category_create'
  | 'ingredient_category_update'
  | 'ingredient_category_delete'
  | 'recipe_create'
  | 'recipe_update'
  | 'recipe_delete'
  | 'employee_create'
  | 'employee_update'
  | 'employee_delete'
  | 'supplier_create'
  | 'supplier_update'
  | 'supplier_delete'
  | 'task_create'
  | 'task_update'
  | 'task_complete'
  | 'task_delete'
  | 'table_create'
  | 'table_update'
  | 'table_delete';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  details: Record<string, unknown>;
}

let activityCounter = 0;

export function generateActivityId(type: ActivityType): string {
  activityCounter++;
  return `${type}_${Date.now()}_${activityCounter}`;
}
