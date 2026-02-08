export const normalizeUnit = (unit: string): string => {
  const u = unit.toLowerCase().trim();
  if (['g', 'gr', 'gram'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilogram'].includes(u)) return 'kg';
  if (['ml', 'mililitre'].includes(u)) return 'ml';
  if (['l', 'lt', 'litre'].includes(u)) return 'l';
  if (['adet', 'tane', 'piece', 'pcs'].includes(u)) return 'adet';
  if (['kaşık', 'spoon', 'yemek kaşığı', 'tbsp'].includes(u)) return 'tbsp';
  if (['çay kaşığı', 'tsp'].includes(u)) return 'tsp';
  if (['bardak', 'cup'].includes(u)) return 'cup';
  return u;
};

export const convertToBase = (amount: number, unit: string): { amount: number, unit: string } => {
  const u = normalizeUnit(unit);
  if (u === 'kg') return { amount: amount * 1000, unit: 'g' };
  if (u === 'l') return { amount: amount * 1000, unit: 'ml' };
  // Default to as-is
  return { amount, unit: u };
};

export const deductIngredient = (
  inventoryAmount: number,
  inventoryUnit: string,
  usedAmount: number,
  usedUnit: string
): { amount: number, unit: string } | null => {
  const inv = convertToBase(inventoryAmount, inventoryUnit);
  const used = convertToBase(usedAmount, usedUnit);

  if (inv.unit === used.unit) {
    const newAmount = inv.amount - used.amount;
    // Convert back to original unit if it was kg/l?
    // If original was kg, and we have 1500g, maybe return 1.5kg?
    if (inventoryUnit === 'kg') return { amount: newAmount / 1000, unit: 'kg' };
    if (inventoryUnit === 'l') return { amount: newAmount / 1000, unit: 'l' };
    return { amount: newAmount, unit: inv.unit };
  }

  // If incompatible units (e.g. adet vs kg), cannot deduct automatically safely.
  // Return null to indicate no change or handle manually?
  // Let's assume we return the original inventory if we can't deduct.
  return null;
};
