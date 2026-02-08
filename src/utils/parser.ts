import type { Ingredient } from '../types';

export const parseIngredientInput = (text: string): Ingredient[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const ingredients: Ingredient[] = [];

  lines.forEach(line => {
    // Basic regex to match amount, unit, and name
    // Examples: "2 kg domates", "500g kıyma", "tuz", "3 adet yumurta"

    // Pattern:
    // ^(\d+(?:[.,]\d+)?)\s*(kg|g|gr|l|ml|adet|paket|bag|demet|kaşık|bardak)?\s*(.+)$
    // This looks for a number at the start, optional unit, then the rest is the name.

    const regex = /^(\d+(?:[.,]\d+)?)\s*(kg|g|gr|ml|l|adet|paket|demet|kaşık|bardak|kutu|bottle|can|jar|slice|piece)?\s+(.+)$/i;
    const match = line.trim().match(regex);

    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const unit = match[2] ? match[2].toLowerCase() : 'adet'; // Default unit if number present but no unit? Or maybe match[2] is undefined.
      // If unit is undefined, it means "2 domates". Usually implies pieces/adet.

      const name = match[3].trim();

      ingredients.push({
        id: crypto.randomUUID(),
        name,
        amount,
        unit: unit || 'adet'
      });
    } else {
      // No number found at start. Assume it's just the name (e.g. "Tuz").
      // Default amount 1, unit 'birim' or similar? Or maybe 0 to indicate "some".
      // User said: "Bazıları için istersem gramaj ekleme imkanım olsun... İstersem çok olduğunu çok belirtmek için falan filan eklemeler yapabileyim".
      // Let's default to amount: 1, unit: 'adet' if not specified, or maybe just store as is?
      // But the prompt needs structure.
      // Let's try to find if there is a number anywhere? No, simpler is better.

      ingredients.push({
        id: crypto.randomUUID(),
        name: line.trim(),
        amount: 1,
        unit: 'adet'
      });
    }
  });

  return ingredients;
};
