import { canTransition, getTimestampField, getAllowedTransitions } from '../utils/order-state-machine';

describe('Order State Machine', () => {
  // ============================================
  // canTransition
  // ============================================

  describe('canTransition', () => {
    describe('valid transitions', () => {
      it('allows pending -> confirmed', () => {
        expect(canTransition('pending', 'confirmed')).toBe(true);
      });

      it('allows pending -> cancelled', () => {
        expect(canTransition('pending', 'cancelled')).toBe(true);
      });

      it('allows confirmed -> preparing', () => {
        expect(canTransition('confirmed', 'preparing')).toBe(true);
      });

      it('allows confirmed -> cancelled', () => {
        expect(canTransition('confirmed', 'cancelled')).toBe(true);
      });

      it('allows preparing -> ready', () => {
        expect(canTransition('preparing', 'ready')).toBe(true);
      });

      it('allows preparing -> cancelled', () => {
        expect(canTransition('preparing', 'cancelled')).toBe(true);
      });

      it('allows ready -> completed', () => {
        expect(canTransition('ready', 'completed')).toBe(true);
      });
    });

    describe('invalid transitions', () => {
      it('disallows completed -> anything', () => {
        expect(canTransition('completed', 'pending')).toBe(false);
        expect(canTransition('completed', 'confirmed')).toBe(false);
        expect(canTransition('completed', 'preparing')).toBe(false);
        expect(canTransition('completed', 'ready')).toBe(false);
        expect(canTransition('completed', 'cancelled')).toBe(false);
      });

      it('disallows cancelled -> anything', () => {
        expect(canTransition('cancelled', 'pending')).toBe(false);
        expect(canTransition('cancelled', 'confirmed')).toBe(false);
        expect(canTransition('cancelled', 'preparing')).toBe(false);
        expect(canTransition('cancelled', 'ready')).toBe(false);
        expect(canTransition('cancelled', 'completed')).toBe(false);
      });

      it('disallows skipping steps (pending -> preparing)', () => {
        expect(canTransition('pending', 'preparing')).toBe(false);
      });

      it('disallows skipping steps (pending -> ready)', () => {
        expect(canTransition('pending', 'ready')).toBe(false);
      });

      it('disallows skipping steps (pending -> completed)', () => {
        expect(canTransition('pending', 'completed')).toBe(false);
      });

      it('disallows going backwards (ready -> preparing)', () => {
        expect(canTransition('ready', 'preparing')).toBe(false);
      });

      it('disallows going backwards (preparing -> confirmed)', () => {
        expect(canTransition('preparing', 'confirmed')).toBe(false);
      });

      it('returns false for unknown status', () => {
        expect(canTransition('unknown', 'confirmed')).toBe(false);
      });
    });
  });

  // ============================================
  // getAllowedTransitions
  // ============================================

  describe('getAllowedTransitions', () => {
    it('returns [confirmed, cancelled] for pending', () => {
      expect(getAllowedTransitions('pending')).toEqual(['confirmed', 'cancelled']);
    });

    it('returns [preparing, cancelled] for confirmed', () => {
      expect(getAllowedTransitions('confirmed')).toEqual(['preparing', 'cancelled']);
    });

    it('returns [ready, cancelled] for preparing', () => {
      expect(getAllowedTransitions('preparing')).toEqual(['ready', 'cancelled']);
    });

    it('returns [completed] for ready', () => {
      expect(getAllowedTransitions('ready')).toEqual(['completed']);
    });

    it('returns empty array for completed', () => {
      expect(getAllowedTransitions('completed')).toEqual([]);
    });

    it('returns empty array for cancelled', () => {
      expect(getAllowedTransitions('cancelled')).toEqual([]);
    });

    it('returns empty array for unknown status', () => {
      expect(getAllowedTransitions('unknown')).toEqual([]);
    });
  });

  // ============================================
  // getTimestampField
  // ============================================

  describe('getTimestampField', () => {
    it('returns "preparedAt" for ready', () => {
      expect(getTimestampField('ready')).toBe('preparedAt');
    });

    it('returns "completedAt" for completed', () => {
      expect(getTimestampField('completed')).toBe('completedAt');
    });

    it('returns null for preparing', () => {
      expect(getTimestampField('preparing')).toBeNull();
    });

    it('returns null for pending', () => {
      expect(getTimestampField('pending')).toBeNull();
    });

    it('returns null for confirmed', () => {
      expect(getTimestampField('confirmed')).toBeNull();
    });

    it('returns null for cancelled', () => {
      expect(getTimestampField('cancelled')).toBeNull();
    });
  });
});
