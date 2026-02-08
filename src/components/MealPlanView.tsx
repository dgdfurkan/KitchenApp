import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Trash2, RotateCcw, Flame, ChefHat, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const MealPlanView: React.FC = () => {
  const { weeklyPlan, setWeeklyPlan } = useAppContext();
  const days = weeklyPlan.days || [];

  const handleClearPlan = () => {
    if (confirm("Tüm yemek planını silmek istediğine emin misin?")) {
      setWeeklyPlan({ days: [] });
    }
  };

  const handleCompleteMeal = (dayIndex: number, mealIndex: number) => {
    // Mark meal as completed (maybe strike through or remove)
    // For now, let's just remove it or add a 'completed' flag if we had one.
    // User said: "Tamamladıktan sonra geçsin gitsin". So remove?
    // "Hangi gündeysem o günün yemek menüsü ana sayfada ilk karşıma çıkan olsun. Tamamladıktan sonra geçsin gitsin".
    // So removing seems appropriate or moving to a 'history'.
    // Let's remove from the list for simplicity as requested "geçsin gitsin".

    const newDays = [...days];
    newDays[dayIndex].meals.splice(mealIndex, 1);

    // If day is empty, maybe remove day? Or keep empty day card?
    // Keep empty day card to show progress.
    setWeeklyPlan({ days: newDays });
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Yemek Planım</h1>
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
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <ChefHat size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">Henüz bir plan yok</h3>
          <p className="text-sm text-gray-400 mt-1 px-8">
            "Şef" sekmesine gidip yeni bir plan oluşturabilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {days.map((day, dIndex) => (
              <motion.div
                key={day.day || dIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100 flex justify-between items-center">
                  <h2 className="font-bold text-blue-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    {day.day}
                  </h2>
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded-full text-blue-600 border border-blue-100">
                    {day.meals.length} Öğün
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {day.meals.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 italic py-2">
                      Bu gün için planlanan tüm yemekler tamamlandı! 🎉
                    </p>
                  ) : (
                    day.meals.map((meal, mIndex) => (
                      <motion.div
                        key={meal.id || mIndex}
                        layout
                        className={cn(
                          "relative p-4 rounded-xl border transition-all",
                          meal.isLeftover
                            ? "bg-orange-50 border-orange-100"
                            : "bg-gray-50 border-gray-100 hover:border-blue-200"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={cn("font-bold text-lg", meal.isLeftover ? "text-orange-800" : "text-gray-800")}>
                            {meal.name}
                          </h3>
                          <button
                            onClick={() => handleCompleteMeal(dIndex, mIndex)}
                            className="p-2 bg-white rounded-full shadow-sm text-green-500 hover:text-green-600 hover:scale-110 transition-all"
                            title="Tamamlandı işaretle"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {meal.description}
                        </p>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {meal.prepTime && (
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                              <Clock size={12} />
                              {meal.prepTime}
                            </div>
                          )}
                          {meal.calories && (
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                              <Flame size={12} />
                              {meal.calories}
                            </div>
                          )}
                          {meal.isLeftover && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200">
                              <RotateCcw size={12} />
                              Dünden Kalan
                            </div>
                          )}
                        </div>

                        {meal.ingredientsUsed && meal.ingredientsUsed.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/50">
                            <p className="text-xs font-medium text-gray-400 mb-1">Kullanılan Malzemeler:</p>
                            <div className="flex flex-wrap gap-1">
                              {meal.ingredientsUsed.map((ing: { name: string; amount: number; unit: string }, i: number) => (
                                <span key={i} className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
                                  {ing.amount} {ing.unit} {ing.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
