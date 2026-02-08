import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Trash2, RotateCcw, Flame, ChefHat, Calendar, ChevronDown, ChevronUp, Snowflake } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { convertToBase } from '../utils/unitConversion';
import { animations } from '../utils/animations';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const MealPlanView: React.FC = () => {
  const { weeklyPlan, setWeeklyPlan, inventory, setInventory } = useAppContext();
  const days = weeklyPlan.days || [];
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [completedMeals, setCompletedMeals] = useState<string[]>([]); // Store IDs of completed meals

  const handleClearPlan = () => {
    if (confirm("Tüm yemek planını silmek istediğine emin misin?")) {
      setWeeklyPlan({ days: [] });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMeal(prev => prev === id ? null : id);
  };

  const handleCompleteMeal = (dayIndex: number, mealIndex: number, mealId: string) => {
    const day = days[dayIndex];
    const meal = day.meals[mealIndex];

    if (completedMeals.includes(mealId)) return; // Already done

    if (confirm(`"${meal.name}" yapıldı olarak işaretlensin ve malzemeler stoktan düşülsün mü?`)) {
      // 1. Deduct Inventory
      const newInventory = [...inventory];
      const usedIngredients: string[] = [];
      let missingIngredients: string[] = [];

      if (meal.ingredientsUsed && !meal.isLeftover) {
        meal.ingredientsUsed.forEach((used: any) => {
             const invIndex = newInventory.findIndex(i => i.name.toLowerCase().includes(used.name.toLowerCase()));

             if (invIndex !== -1) {
               const invItem = newInventory[invIndex];
               const invBase = convertToBase(invItem.amount, invItem.unit);
               const usedBase = convertToBase(used.amount, used.unit);

               if (invBase.unit === usedBase.unit) {
                 const newAmt = Math.max(0, invBase.amount - usedBase.amount);

                 // Update Inventory Item
                 if (invItem.unit === 'kg' && invBase.unit === 'g') newInventory[invIndex].amount = newAmt / 1000;
                 else if (invItem.unit === 'l' && invBase.unit === 'ml') newInventory[invIndex].amount = newAmt / 1000;
                 else newInventory[invIndex].amount = newAmt;

                 usedIngredients.push(used.name);
               } else {
                 missingIngredients.push(`${used.name} (Birim uyuşmazlığı)`);
               }
             } else {
               missingIngredients.push(used.name);
             }
        });
      }

      setInventory(newInventory);
      setCompletedMeals(prev => [...prev, mealId]);
      alert(`${usedIngredients.length} kalem malzeme stoktan düşüldü! Afiyet olsun. 😋`);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto min-h-screen">
      <header className="mb-6 flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">Yemek Planım</h1>
          <p className="text-sm text-gray-500">Haftalık lezzet rotan.</p>
        </div>
        {days.length > 0 && (
          <button
            onClick={handleClearPlan}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Planı Temizle"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {days.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <ChefHat size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-600">Henüz bir plan yok</h3>
          <p className="text-sm text-gray-400 mt-2 px-8">
            "Şef" sekmesine gidip sihirli bir menü oluşturabilirsin.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={animations.container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {days.map((day, dIndex) => (
            <div key={dIndex} className="relative">
              {/* Timeline Line */}
              {dIndex !== days.length - 1 && (
                <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 to-transparent -z-10" />
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-violet-100 flex items-center justify-center shadow-sm z-10">
                  <Calendar className="text-violet-500" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{day.day}</h2>
              </div>

              <div className="pl-16 space-y-4">
                {day.meals.map((meal, mIndex) => {
                  const isCompleted = completedMeals.includes(meal.id);
                  const isExpanded = expandedMeal === meal.id;

                  return (
                    <motion.div
                      key={meal.id || mIndex}
                      variants={animations.item}
                      className={cn(
                        "relative bg-white/80 backdrop-blur-md rounded-2xl border transition-all overflow-hidden",
                        isCompleted ? "opacity-60 grayscale border-gray-200" :
                        meal.isLeftover ? "border-orange-200 bg-orange-50/50" : "border-white shadow-sm hover:shadow-md hover:border-violet-200"
                      )}
                    >
                      <div className="p-4" onClick={() => toggleExpand(meal.id)}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={cn("font-bold text-lg leading-tight", meal.isLeftover ? "text-orange-800" : "text-gray-800")}>
                            {meal.name}
                          </h3>
                          {!isCompleted && !meal.isLeftover && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteMeal(dIndex, mIndex, meal.id); }}
                              className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Pişirdim & Stoktan Düş"
                            >
                              <CheckCircle size={20} />
                            </button>
                          )}
                          {isCompleted && <CheckCircle className="text-green-500" size={20} />}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
                          {meal.description}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          {meal.prepTime && (
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                              <Clock size={12} />
                              {meal.prepTime}
                            </div>
                          )}
                          {meal.calories && (
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                              <Flame size={12} />
                              {meal.calories}
                            </div>
                          )}
                          {meal.freezerInstructions && (
                             <div className="flex items-center gap-1 bg-cyan-50 text-cyan-700 px-2 py-1 rounded-lg">
                              <Snowflake size={12} />
                              Donuk
                            </div>
                          )}
                          {meal.isLeftover && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                              <RotateCcw size={12} />
                              Dünden Kalan
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Recipe View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50/50 border-t border-gray-100"
                          >
                            <div className="p-5 space-y-4">
                               {meal.recipe && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Reçete (Tarif)</h4>
                                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{meal.recipe}</p>
                                </div>
                              )}

                              {meal.ingredientsUsed && meal.ingredientsUsed.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Gerekli Malzemeler</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {meal.ingredientsUsed.map((ing: any, i: number) => (
                                      <span key={i} className="text-xs bg-white px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium shadow-sm">
                                        {ing.amount} {ing.unit} {ing.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {meal.freezerInstructions && (
                                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-100 text-cyan-800 text-xs">
                                  <strong className="block mb-1 font-bold flex items-center gap-1"><Snowflake size={12}/> Dondurucu Talimatı:</strong>
                                  {meal.freezerInstructions}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setExpandedMeal(null)}
                              className="w-full py-2 bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors flex justify-center"
                            >
                              <ChevronUp size={16} />
                            </button>
                          </motion.div>
                        )}
                        {!isExpanded && (
                           <button
                              onClick={() => setExpandedMeal(meal.id)}
                              className="w-full py-1 bg-gray-50/50 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors flex justify-center border-t border-gray-50"
                            >
                              <ChevronDown size={14} />
                            </button>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
