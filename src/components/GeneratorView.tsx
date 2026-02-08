import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, Clock, Users, Flame, Calendar, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { convertToBase } from '../utils/unitConversion';

// Utility for class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const GeneratorView: React.FC = () => {
  const { inventory, setInventory, setWeeklyPlan, incrementUsage } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [days, setDays] = useState(1);
  const [people, setPeople] = useState(2);
  const [time, setTime] = useState(30); // minutes
  const [calories, setCalories] = useState('Standart'); // or number range
  const [mealTypes, setMealTypes] = useState<string[]>(['Akşam Yemeği']);
  const [isFreezerFriendly, setIsFreezerFriendly] = useState(false);
  const [batchCooking, setBatchCooking] = useState(false); // Cook once, eat twice

  const toggleMealType = (type: string) => {
    setMealTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const generatePrompt = () => {
    const ingredientList = inventory.map(i => `- ${i.amount} ${i.unit} ${i.name}`).join('\n');

    const prompt = `
Sen profesyonel bir şef ve beslenme uzmanısın. Elimdeki malzemeleri kullanarak bana muazzam bir yemek planı oluşturmanı istiyorum.

ELİMDEKİ MALZEMELER:
${ingredientList || "Elimde özel bir malzeme yok, genel öneriler yap."}

KISITLAMALAR VE TERCİHLER:
- Plan Süresi: ${days} gün
- Kişi Sayısı: ${people} kişi
- Hazırlama Süresi (Maksimum): ${time} dakika
- Öğün Tipleri: ${mealTypes.join(', ')}
- Kalori Tercihi: ${calories}
- Derin Dondurucuya Uygun Olsun mu?: ${isFreezerFriendly ? 'Evet' : 'Hayır'}
- Toplu Pişirme (Batch Cooking): ${batchCooking ? 'Evet (Bir gün yapıp ertesi gün de yiyebileyim, porsiyonları buna göre ayarla)' : 'Hayır'}

GÖREV:
Yukarıdaki malzemeleri ve kısıtlamaları dikkate alarak detaylı bir yemek planı oluştur.
Eğer elimdeki malzemeler yetersizse, minimum ekleme ile yapılabilecek tarifler öner.
Eğer "Toplu Pişirme" seçiliyse, ertesi gün için "Dünden Kalan" olarak işaretle.

ÇIKTI FORMATI (ÇOK ÖNEMLİ):
Bana SADECE geçerli bir JSON objesi döndür. Markdown blokları (\`\`\`json ... \`\`\`) kullanma. Sadece saf JSON string'i ver.
JSON Şeması şu şekilde olmalı:
{
  "days": [
    {
      "day": "Gün 1",
      "meals": [
        {
          "name": "Yemek Adı",
          "description": "Kısa ve iştah açıcı açıklama.",
          "recipe": "Kısa tarif adımları.",
          "ingredientsUsed": [
            { "name": "Kullanılan Malzeme Adı", "amount": 0.5, "unit": "kg" }
          ],
          "isLeftover": false,
          "prepTime": "30 dk",
          "calories": "500 kcal"
        }
      ]
    }
  ]
}

NOT: "isLeftover": true olduğunda, "name" kısmına "Dünden Kalan: [Yemek Adı]" yaz ve "ingredientsUsed" listesini boş bırak ([]).
JSON dışında hiçbir metin yazma.
`;

    setGeneratedPrompt(prompt.trim());
    incrementUsage();
    setSuccessMessage(null);
    setProcessingError(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessResponse = () => {
    try {
      setProcessingError(null);
      setSuccessMessage(null);

      // Clean up JSON input (remove markdown blocks if present)
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (!data.days || !Array.isArray(data.days)) {
        throw new Error("Geçersiz format: 'days' listesi bulunamadı.");
      }

      // 1. Update Weekly Plan
      setWeeklyPlan({ days: data.days });

      // 2. Update Inventory
      const newInventory = [...inventory];
      const usedIngredients: string[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.days.forEach((day: any) => {
        // Ensure meals have IDs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        day.meals = day.meals.map((m: any) => ({ ...m, id: m.id || crypto.randomUUID() }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        day.meals.forEach((meal: any) => {
          if (meal.isLeftover) return; // Don't deduct for leftovers
          if (!meal.ingredientsUsed || !Array.isArray(meal.ingredientsUsed)) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meal.ingredientsUsed.forEach((used: any) => {
            if (!used.name || !used.amount) return;

            // Find matching ingredient in inventory (fuzzy match?)
            const invIndex = newInventory.findIndex(i =>
              i.name.toLowerCase().includes(used.name.toLowerCase()) ||
              used.name.toLowerCase().includes(i.name.toLowerCase())
            );

            if (invIndex !== -1) {
              const invItem = newInventory[invIndex];
              const invBase = convertToBase(invItem.amount, invItem.unit);
              const usedBase = convertToBase(used.amount, used.unit);

              // Check if units are compatible (both mass or both volume or both pieces)
              // convertToBase returns 'g', 'ml', or original.
              // If units match, subtract.
              if (invBase.unit === usedBase.unit) {
                let newAmount = invBase.amount - usedBase.amount;
                if (newAmount < 0) newAmount = 0; // Don't go below zero

                // Convert back to original unit if possible/approximate
                // If original was kg, and we have 1500g, keep as kg (1.5)
                if (invItem.unit === 'kg' && invBase.unit === 'g') {
                  newInventory[invIndex] = { ...invItem, amount: parseFloat((newAmount / 1000).toFixed(2)) };
                } else if (invItem.unit === 'l' && invBase.unit === 'ml') {
                  newInventory[invIndex] = { ...invItem, amount: parseFloat((newAmount / 1000).toFixed(2)) };
                } else {
                  newInventory[invIndex] = { ...invItem, amount: parseFloat(newAmount.toFixed(2)), unit: invBase.unit };
                }

                usedIngredients.push(`${used.name} (${used.amount} ${used.unit})`);
              }
            }
          });
        });
      });

      setInventory(newInventory);
      setSuccessMessage(`Plan oluşturuldu ve ${usedIngredients.length} malzeme stoktan düşüldü!`);
      setJsonInput('');

    } catch (err) {
      console.error(err);
      setProcessingError("JSON işlenirken hata oluştu. Lütfen formatı kontrol edin.");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Şefin Masası</h1>
        <p className="text-sm text-gray-500">Kriterleri belirle, Gemini şefe sor.</p>
      </header>

      <div className="space-y-6">
        {/* Duration Slider */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-700">
            <Calendar size={18} />
            <h3 className="font-medium">Plan Süresi</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="font-bold text-blue-600 w-12 text-center">{days} Gün</span>
          </div>
        </div>

        {/* People Counter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-700">
            <Users size={18} />
            <h3 className="font-medium">Kişi Sayısı</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200"
            >-</button>
            <span className="font-bold text-gray-800 text-lg w-8 text-center">{people}</span>
            <button
              onClick={() => setPeople(people + 1)}
              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold hover:bg-blue-200"
            >+</button>
          </div>
        </div>

        {/* Time Slider */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-700">
            <Clock size={18} />
            <h3 className="font-medium">Hazırlama Süresi (Maks)</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="font-bold text-orange-500 w-16 text-center">{time} dk</span>
          </div>
        </div>

        {/* Calorie Preference */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-700">
            <Flame size={18} />
            <h3 className="font-medium">Kalori Tercihi</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Düşük Kalori', 'Standart', 'Yüksek Protein', 'Bol Karbonhidrat'].map(opt => (
              <button
                key={opt}
                onClick={() => setCalories(opt)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                  calories === opt
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Types */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-3">Öğünler</h3>
          <div className="flex flex-wrap gap-2">
            {['Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün'].map(type => (
              <button
                key={type}
                onClick={() => toggleMealType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  mealTypes.includes(type)
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Other Options */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={batchCooking}
              onChange={(e) => setBatchCooking(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700">Toplu Pişirme (2 Günlük Yap)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFreezerFriendly}
              onChange={(e) => setIsFreezerFriendly(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700">Dondurucuya Uygun Olsun</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePrompt}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <Sparkles size={24} />
          Prompt Oluştur
        </button>

        {/* Prompt Output Area */}
        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs font-mono overflow-auto max-h-60 relative group">
                <pre>{generatedPrompt}</pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-center text-xs text-gray-500">
                Bu metni kopyalayıp Gemini'ye yapıştırın, gelen cevabı aşağıya girin.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response Input Area */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="flex items-center gap-2 mb-3 text-gray-700">
            <ArrowRight size={18} />
            <h3 className="font-medium">2. Adım: Cevabı Yapıştır</h3>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Gemini&#39;den gelen JSON cevabını buraya yapıştırın...'
            className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-3 text-xs font-mono text-gray-700"
          />

          {processingError && (
            <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {processingError}
            </div>
          )}

          {successMessage && (
            <div className="mb-3 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">
              {successMessage}
            </div>
          )}

          <button
            onClick={handleProcessResponse}
            disabled={!jsonInput.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={20} />
            Planı Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
