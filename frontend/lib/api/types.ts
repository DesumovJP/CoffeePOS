/**
 * CoffeePOS - API Types
 *
 * TypeScript types matching Strapi content types
 */

// ============================================
// BASE TYPES
// ============================================

export interface StrapiEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface StrapiMedia {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Record<string, {
    url: string;
    width: number;
    height: number;
  }>;
  url: string;
  previewUrl?: string;
  provider: string;
}

// ============================================
// CATEGORY
// ============================================

export interface Category extends StrapiEntity {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  image?: StrapiMedia;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
  parentCategory?: Category;
}

export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentCategory?: number;
}

// ============================================
// PRODUCT
// ============================================

export type ProductInventoryType = 'none' | 'simple' | 'recipe';

export interface Product extends StrapiEntity {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  image?: StrapiMedia;
  gallery?: StrapiMedia[];
  category?: Category;
  modifierGroups?: ModifierGroup[];
  isActive: boolean;
  isFeatured: boolean;
  trackInventory: boolean;
  inventoryType: ProductInventoryType;
  stockQuantity: number;
  lowStockThreshold: number;
  sortOrder: number;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  recipe?: Recipe;
}

export interface ProductInput {
  name: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  image?: number;
  category?: number;
  modifierGroups?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  sortOrder?: number;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
}

// ============================================
// MODIFIER GROUP
// ============================================

export interface ModifierGroup extends StrapiEntity {
  name: string;
  displayName?: string;
  description?: string;
  type: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number;
  sortOrder: number;
  isActive: boolean;
  modifiers?: Modifier[];
  products?: Product[];
}

export interface ModifierGroupInput {
  name: string;
  displayName?: string;
  description?: string;
  type: 'single' | 'multiple';
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// MODIFIER
// ============================================

export interface Modifier extends StrapiEntity {
  name: string;
  displayName?: string;
  price: number;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  modifierGroup?: ModifierGroup;
}

export interface ModifierInput {
  name: string;
  displayName?: string;
  price?: number;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierGroup?: number;
}

// ============================================
// ORDER
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type DiscountType = 'percentage' | 'fixed' | 'none';
export type OrderPriority = 'normal' | 'rush';

export interface Order extends StrapiEntity {
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountCode?: string;
  taxAmount: number;
  total: number;
  notes?: string;
  items?: OrderItem[];
  payment?: Payment;
  completedAt?: string;
  preparedAt?: string;
  estimatedPrepTime?: number;
  priority: OrderPriority;
  createdBy?: string;
}

export interface OrderInput {
  orderNumber: string;
  status?: OrderStatus;
  type?: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount?: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountCode?: string;
  taxAmount?: number;
  total: number;
  notes?: string;
  estimatedPrepTime?: number;
  priority?: OrderPriority;
  completedAt?: string;
  preparedAt?: string;
}

// ============================================
// ORDER ITEM
// ============================================

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem extends StrapiEntity {
  order?: Order;
  product?: Product;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: OrderItemModifier[];
  notes?: string;
  status: OrderItemStatus;
  preparedAt?: string;
}

export interface OrderItemInput {
  order?: number;
  product?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: OrderItemModifier[];
  notes?: string;
  status?: OrderItemStatus;
  preparedAt?: string;
}

// ============================================
// PAYMENT
// ============================================

export type PaymentMethod = 'cash' | 'card' | 'qr' | 'online' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';

export interface Payment extends StrapiEntity {
  order?: Order;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  receivedAmount?: number;
  changeAmount: number;
  tipAmount: number;
  transactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  receiptNumber?: string;
  processedAt?: string;
  refundReason?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInput {
  order?: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  tipAmount?: number;
  transactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  receiptNumber?: string;
  processedAt?: string;
  refundReason?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// CAFE TABLE
// ============================================

export interface CafeTable extends StrapiEntity {
  number: number;
  seats: number;
  zone?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CafeTableInput {
  number: number;
  seats: number;
  zone?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================
// INGREDIENT (for inventory management)
// ============================================

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'portion';

export interface Ingredient extends StrapiEntity {
  name: string;
  slug: string;
  description?: string;
  unit: IngredientUnit;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  supplier?: string;
  isActive: boolean;
  image?: StrapiMedia;
  category?: IngredientCategory;
  // Calculated fields
  totalCost?: number;
  isLowStock?: boolean;
}

export interface IngredientInput {
  name: string;
  description?: string;
  unit: IngredientUnit;
  quantity?: number;
  minQuantity?: number;
  costPerUnit?: number;
  supplier?: string;
  isActive?: boolean;
  category?: number;
}

// ============================================
// INGREDIENT CATEGORY
// ============================================

export interface IngredientCategory extends StrapiEntity {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  ingredients?: Ingredient[];
}

export interface IngredientCategoryInput {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// RECIPE (links Products to Ingredients)
// ============================================

export interface RecipeIngredient {
  id: string;
  ingredient: Ingredient;
  ingredientId: number;
  amount: number;
  unit: IngredientUnit;
}

export interface Recipe extends StrapiEntity {
  product?: Product;
  ingredients: RecipeIngredient[];
  yield: number;
  yieldUnit: string;
  preparationNotes?: string;
  totalCost?: number;
}

export interface RecipeInput {
  product?: number;
  ingredients: Array<{
    ingredientId: number;
    amount: number;
    unit: IngredientUnit;
  }>;
  yield?: number;
  yieldUnit?: string;
  preparationNotes?: string;
}

// ============================================
// INVENTORY TRANSACTION (stock movements)
// ============================================

export type InventoryTransactionType =
  | 'purchase'      // Bought ingredients
  | 'sale'          // Deducted from sale
  | 'adjustment'    // Manual adjustment
  | 'waste'         // Spoilage/waste
  | 'transfer'      // Transfer between locations
  | 'return';       // Return to supplier

export interface InventoryTransaction extends StrapiEntity {
  ingredient?: Ingredient;
  product?: Product;
  type: InventoryTransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  notes?: string;
  performedBy?: string;
}

export interface InventoryTransactionInput {
  ingredient?: number;
  product?: number;
  type: InventoryTransactionType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  performedBy?: string;
}
