'use client';

/**
 * CoffeePOS - ModifierModal Component
 *
 * Product modifier selection (sizes, addons, notes)
 */

import { forwardRef, useState, useMemo, type HTMLAttributes } from 'react';
import { Text, Button, Icon, Divider } from '@/components/atoms';
import { Modal } from '@/components/atoms/Modal';
import { QuantityControl, PriceTag } from '@/components/molecules';
import styles from './ModifierModal.module.css';

// ============================================
// TYPES
// ============================================

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required?: boolean;
  options: ModifierOption[];
}

export interface ProductForModifier {
  id: string;
  name: string;
  basePrice: number;
  image?: string;
  modifierGroups: ModifierGroup[];
}

export interface SelectedModifiers {
  [groupId: string]: string | string[];
}

export interface ModifierModalResult {
  productId: string;
  quantity: number;
  modifiers: Array<{ id: string; name: string; price: number }>;
  notes?: string;
  totalPrice: number;
}

export interface ModifierModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Product to customize */
  product: ProductForModifier | null;
  /** Currency symbol */
  currency?: string;
  /** Initial quantity */
  initialQuantity?: number;
  /** Initial selected modifiers */
  initialModifiers?: SelectedModifiers;
  /** Initial notes */
  initialNotes?: string;
  /** Callback when adding to order */
  onAddToOrder: (result: ModifierModalResult) => void;
  /** Edit mode (updates existing item) */
  editMode?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const ModifierModal = forwardRef<HTMLDivElement, ModifierModalProps>(
  (
    {
      open,
      onClose,
      product,
      currency = '₴',
      initialQuantity = 1,
      initialModifiers = {},
      initialNotes = '',
      onAddToOrder,
      editMode = false,
      className,
      ...props
    },
    ref
  ) => {
    // State
    const [quantity, setQuantity] = useState(initialQuantity);
    const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>(initialModifiers);
    const [notes, setNotes] = useState(initialNotes);

    // Reset state when product changes
    useState(() => {
      if (product) {
        setQuantity(initialQuantity);
        setSelectedModifiers(initialModifiers);
        setNotes(initialNotes);
      }
    });

    // Calculate total price
    const { unitPrice, totalPrice, selectedModifiersList } = useMemo(() => {
      if (!product) {
        return { unitPrice: 0, totalPrice: 0, selectedModifiersList: [] };
      }

      let price = product.basePrice;
      const modifiersList: Array<{ id: string; name: string; price: number }> = [];

      for (const group of product.modifierGroups) {
        const selected = selectedModifiers[group.id];

        if (group.type === 'single' && typeof selected === 'string') {
          const option = group.options.find((o) => o.id === selected);
          if (option) {
            price += option.price;
            modifiersList.push({ id: option.id, name: option.name, price: option.price });
          }
        } else if (group.type === 'multiple' && Array.isArray(selected)) {
          for (const optionId of selected) {
            const option = group.options.find((o) => o.id === optionId);
            if (option) {
              price += option.price;
              modifiersList.push({ id: option.id, name: option.name, price: option.price });
            }
          }
        }
      }

      return {
        unitPrice: price,
        totalPrice: price * quantity,
        selectedModifiersList: modifiersList,
      };
    }, [product, selectedModifiers, quantity]);

    // Check if all required modifiers are selected
    const canSubmit = useMemo(() => {
      if (!product) return false;

      for (const group of product.modifierGroups) {
        if (group.required) {
          const selected = selectedModifiers[group.id];
          if (group.type === 'single' && !selected) return false;
          if (group.type === 'multiple' && (!Array.isArray(selected) || selected.length === 0)) return false;
        }
      }

      return true;
    }, [product, selectedModifiers]);

    // Handlers
    const handleSingleSelect = (groupId: string, optionId: string) => {
      setSelectedModifiers((prev) => ({
        ...prev,
        [groupId]: optionId,
      }));
    };

    const handleMultipleToggle = (groupId: string, optionId: string) => {
      setSelectedModifiers((prev) => {
        const current = (prev[groupId] as string[]) || [];
        const isSelected = current.includes(optionId);

        return {
          ...prev,
          [groupId]: isSelected
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      });
    };

    const handleSubmit = () => {
      if (!product || !canSubmit) return;

      onAddToOrder({
        productId: product.id,
        quantity,
        modifiers: selectedModifiersList,
        notes: notes.trim() || undefined,
        totalPrice,
      });

      handleClose();
    };

    const handleClose = () => {
      setQuantity(1);
      setSelectedModifiers({});
      setNotes('');
      onClose();
    };

    if (!product) return null;

    const footer = (
      <>
        <Button variant="secondary" size="lg" onClick={handleClose}>
          Скасувати
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          fullWidth
        >
          <Icon name="plus" size="md" />
          {editMode ? 'Оновити' : 'Додати'} — {currency}{totalPrice.toFixed(2)}
        </Button>
      </>
    );

    return (
      <Modal
        ref={ref}
        open={open}
        onClose={handleClose}
        title={editMode ? 'Редагувати позицію' : 'Налаштувати'}
        size="md"
        footer={footer}
        className={className}
        {...props}
      >
        <div className={styles.content}>
          {/* Product header */}
          <div className={styles.productHeader}>
            <div className={styles.productImage}>
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <Icon name="package" size="xl" color="tertiary" />
              )}
            </div>
            <div className={styles.productInfo}>
              <Text variant="h4" weight="semibold">
                {product.name}
              </Text>
              <PriceTag price={product.basePrice} currency={currency} size="lg" />
            </div>
          </div>

          {/* Modifier groups */}
          {product.modifierGroups.map((group) => (
            <div key={group.id} className={styles.modifierGroup}>
              <div className={styles.groupHeader}>
                <Text variant="labelLarge" weight="medium">
                  {group.name}
                  {group.required && (
                    <Text as="span" color="error"> *</Text>
                  )}
                </Text>
                {group.type === 'multiple' && (
                  <Text variant="bodySmall" color="tertiary">
                    Можна обрати декілька
                  </Text>
                )}
              </div>

              {group.type === 'single' ? (
                <div className={styles.sizeOptions}>
                  {group.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.sizeOption} ${
                        selectedModifiers[group.id] === option.id ? styles.selected : ''
                      }`}
                      onClick={() => handleSingleSelect(group.id, option.id)}
                    >
                      <Text
                        variant="labelMedium"
                        color={selectedModifiers[group.id] === option.id ? 'primary' : 'secondary'}
                      >
                        {option.name}
                      </Text>
                      {option.price > 0 && (
                        <Text
                          variant="bodySmall"
                          color={selectedModifiers[group.id] === option.id ? 'accent' : 'tertiary'}
                        >
                          +{currency}{option.price}
                        </Text>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.addonOptions}>
                  {group.options.map((option) => {
                    const isSelected = ((selectedModifiers[group.id] as string[]) || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.addonOption} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleMultipleToggle(group.id, option.id)}
                      >
                        <div className={styles.addonCheckbox}>
                          {isSelected && <Icon name="check" size="sm" color="inverse" />}
                        </div>
                        <div className={styles.addonInfo}>
                          <Text
                            variant="labelMedium"
                            color={isSelected ? 'primary' : 'secondary'}
                          >
                            {option.name}
                          </Text>
                          {option.price > 0 && (
                            <Text
                              variant="bodySmall"
                              color={isSelected ? 'accent' : 'tertiary'}
                            >
                              +{currency}{option.price}
                            </Text>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <Divider spacing="sm" />

          {/* Quantity */}
          <div className={styles.quantitySection}>
            <Text variant="labelMedium" color="secondary">
              Кількість
            </Text>
            <QuantityControl
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={99}
              size="lg"
            />
          </div>

          <Divider spacing="sm" />

          {/* Notes */}
          <div className={styles.notesSection}>
            <Text variant="labelMedium" color="secondary">
              Примітка (опціонально)
            </Text>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Без цукру, без льоду..."
              className={styles.notesTextarea}
              rows={3}
            />
          </div>

          {/* Total preview */}
          <div className={styles.totalPreview}>
            <div>
              <Text variant="bodySmall" color="tertiary">
                {quantity} × {currency}{unitPrice.toFixed(2)}
              </Text>
              <Text variant="labelMedium" color="secondary">
                Разом
              </Text>
            </div>
            <Text variant="h3" weight="bold" color="primary">
              {currency}{totalPrice.toFixed(2)}
            </Text>
          </div>
        </div>
      </Modal>
    );
  }
);

ModifierModal.displayName = 'ModifierModal';
