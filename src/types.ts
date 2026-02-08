export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string; // 'g', 'kg', 'ml', 'l', 'adet', 'paket', etc.
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredientsUsed: { name: string; amount: number; unit: string }[];
  isLeftover: boolean;
  originalDay?: string; // If leftover, which day it came from
  recipe?: string; // Optional full recipe text
  prepTime?: string;
  calories?: string;
  freezerInstructions?: string; // For Freezer Prep mode
}

export interface DayPlan {
  day: string; // "Monday", "Tuesday", etc.
  meals: Meal[]; // Could be Breakfast, Lunch, Dinner, etc. But simple list for now
}

export interface WeeklyPlan {
  days: DayPlan[];
}

export interface Settings {
  apiKey?: string; // Optional if we don't store it
  usageCount: number; // For the manual tracker
  lastResetDate: string; // To reset daily
}

export interface AppState {
  inventory: Ingredient[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
}
