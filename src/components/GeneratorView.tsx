import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, Calendar, ArrowRight, Settings2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { convertToBase } from '../utils/unitConversion';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface BatchLink {
  fromDay: number; // 1-based index
  toDay: number;
}

export const GeneratorView: React.FC = () => {
  const { inventory, setWeeklyPlan, setInventory, incrementUsage } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Advanced Form State
  const [days, setDays] = useState(3);
  const [people] = useState(2);
  const [time] = useState(45);
  const [calories] = useState('Standart');
  const [cuisine, setCuisine] = useState<string[]>(['Türk Mutfağı']);
  const [mood, setMood] = useState('Pratik ve Lezzetli');
  const [equipment, setEquipment] = useState<string[]>(['Ocak', 'Fırın']);
  const [batchLinks, setBatchLinks] = useState<BatchLink[]>([]);

  // Toggle helpers
  const toggleSelection = (_list: string[], item: string, setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleBatchLink = (day: number) => {
    // If day is already a "receiver" (toDay), remove the link
    if (batchLinks.some(l => l.toDay === day)) {
      setBatchLinks(prev => prev.filter(l => l.toDay !== day));
      return;
    }
    // Else, link it to the previous day
    if (day > 1) {
      setBatchLinks(prev => [...prev, { fromDay: day - 1, toDay: day }]);
    }
  };

  const generatePrompt = () => {
    const ingredientList = inventory.map(i => `- ${i.amount} ${i.unit} ${i.name}`).join('\n');

    // Construct readable batch schedule
    const batchSchedule = batchLinks.map(l => `Gün ${l.fromDay} -> Gün ${l.toDay} (Dünden Kalan)`).join(', ');

    const prompt = `
Sen dünya standartlarında yaratıcı bir şefsin. Aşağıdaki malzemeler ve kısıtlamalarla bana MUAZZAM bir yemek planı oluştur.

ELİMDEKİ MALZEMELER:
${ingredientList || "Elimde özel bir malzeme yok, temel kiler malzemeleri var varsay."}

KISITLAMALAR:
- Süre: ${days} Günlük Plan
- Kişi Sayısı: ${people}
- Maksimum Hazırlık Süresi: ${time} dakika
- Kalori Hedefi: ${calories}
- Mutfak Tercihi: ${cuisine.join(', ')}
- Yemek Modu: ${mood}
- Mutfak Ekipmanları: ${equipment.join(', ')}

TOPLU PİŞİRME (BATCH COOKING) PLANI:
${batchSchedule ? batchSchedule : "Her gün taze yemek yapılacak."}
(Eğer "Dünden Kalan" işaretliyse, o gün yemek pişirilmeyecek, önceki günün yemeği ısıtılıp yenecek. Porsiyonları buna göre hesapla.)

GÖREV:
Detaylı, lezzetli ve israfı önleyen bir plan yap. Eksik malzeme varsa "Alışveriş Listesi"ne ekleyebileceğim makul şeyler öner (ama minimumda tut).

ÇIKTI FORMATI (JSON):
SADECE aşağıdaki JSON şemasını döndür. Markdown yok. Yorum satırı yok.
{
  "days": [
    {
      "day": "Gün 1 (Pazartesi vb.)",
      "meals": [
        {
          "name": "Yemek İsmi",
          "description": "Kısa, iştah açıcı açıklama.",
          "recipe": "Kısa tarif adımları.",
          "ingredientsUsed": [
            { "name": "Malzeme", "amount": 0.5, "unit": "kg" }
          ],
          "isLeftover": false,
          "prepTime": "30 dk",
          "calories": "500 kcal"
        }
      ]
    }
  ]
}
NOT: Eğer isLeftover: true ise, ingredientsUsed boş dizi [] olsun.
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
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      if (!data.days || !Array.isArray(data.days)) throw new Error("JSON formatı hatalı: 'days' dizisi eksik.");

      setWeeklyPlan({ days: data.days });

      const newInventory = [...inventory];
      let deductCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.days.forEach((day: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        day.meals = day.meals.map((m: any) => ({ ...m, id: m.id || crypto.randomUUID() }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        day.meals.forEach((meal: any) => {
          if (meal.isLeftover || !meal.ingredientsUsed) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meal.ingredientsUsed.forEach((used: any) => {
             const invIndex = newInventory.findIndex(i => i.name.toLowerCase().includes(used.name.toLowerCase()));
             if (invIndex !== -1) {
               const invItem = newInventory[invIndex];
               const invBase = convertToBase(invItem.amount, invItem.unit);
               const usedBase = convertToBase(used.amount, used.unit);
               if (invBase.unit === usedBase.unit) {
                 const newAmt = Math.max(0, invBase.amount - usedBase.amount);
                 // Simple updates for now, ideally convert back
                 if (invItem.unit === 'kg' && invBase.unit === 'g') newInventory[invIndex].amount = newAmt / 1000;
                 else if (invItem.unit === 'l' && invBase.unit === 'ml') newInventory[invIndex].amount = newAmt / 1000;
                 else newInventory[invIndex].amount = newAmt;

                 deductCount++;
               }
             }
          });
        });
      });

      setInventory(newInventory);
      setSuccessMessage(`Harika! Plan yüklendi ve ${deductCount} kalem malzeme stoktan düşüldü.`);
      setJsonInput('');
    } catch (e) {
      setProcessingError("JSON Hatası: Lütfen Gemini cevabını olduğu gibi yapıştırın.");
      console.error(e);
    }
  };

  return (
    <div className="p-4 pb-28 max-w-lg mx-auto min-h-screen">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 mb-2">
          Şefin Stüdyosu 👨‍🍳
        </h1>
        <p className="text-gray-500 text-sm">Hayalindeki menüyü tasarla.</p>
      </header>

      <div className="space-y-6">
        {/* DAY SLIDER & BATCH LINKER */}
        <section className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Calendar className="text-violet-500" size={20} />
              Zaman Çizelgesi
            </h3>
            <span className="text-2xl font-black text-violet-600">{days} Gün</span>
          </div>

          <input
            type="range" min="1" max="7" value={days}
            onChange={(e) => { setDays(parseInt(e.target.value)); setBatchLinks([]); }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600 mb-6"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: days }).map((_, i) => {
              const dayNum = i + 1;
              const isLinked = batchLinks.some(l => l.toDay === dayNum);

              return (
                <button
                  key={dayNum}
                  onClick={() => handleBatchLink(dayNum)}
                  disabled={dayNum === 1}
                  className={cn(
                    "flex-shrink-0 w-14 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden",
                    isLinked
                      ? "bg-orange-50 border-orange-400 text-orange-600"
                      : "bg-white border-gray-100 text-gray-500 hover:border-violet-200"
                  )}
                >
                  {isLinked && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-orange-400" />
                  )}
                  <span className="text-xs font-bold">GÜN</span>
                  <span className="text-xl font-black">{dayNum}</span>
                  {isLinked ? <LinkIcon size={12} /> : dayNum > 1 && <span className="text-[10px] opacity-50">Bağla</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Günleri birbirine bağlayarak "Dünden Kalan" (Toplu Pişirme) planlayabilirsin.
          </p>
        </section>

        {/* SMART FILTERS */}
        <section className="glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Settings2 className="text-pink-500" size={20} />
            Akıllı Tercihler
          </h3>

          {/* Cuisine */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mutfak</label>
            <div className="flex flex-wrap gap-2">
              {['Türk Mutfağı', 'İtalyan', 'Uzak Doğu', 'Akdeniz', 'Sürpriz'].map(c => (
                <button
                  key={c}
                  onClick={() => toggleSelection(cuisine, c, setCuisine)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    cuisine.includes(c)
                      ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200"
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mod</label>
            <div className="grid grid-cols-2 gap-2">
              {['Pratik ve Hızlı', 'Ziyafet Sofrası', 'Diyet / Hafif', 'Anne Yemeği (Comfort)'].map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-all border text-left",
                    mood === m
                      ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-200"
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

           {/* Equipment */}
           <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Ekipman</label>
            <div className="flex flex-wrap gap-2">
              {['Ocak', 'Fırın', 'Airfryer', 'Düdüklü', 'Blender'].map(eq => (
                <button
                  key={eq}
                  onClick={() => toggleSelection(equipment, eq, setEquipment)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                    equipment.includes(eq)
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-400 border-gray-100"
                  )}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Generate Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generatePrompt}
          className="w-full py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-2xl shadow-xl shadow-violet-500/30 flex items-center justify-center gap-3 text-lg font-bold"
        >
          <Sparkles className="animate-pulse" />
          Sihirli Menüyü Oluştur
        </motion.button>

        {/* Prompt Output */}
        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 rounded-3xl border-2 border-violet-100"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-violet-400 uppercase">Gemini Prompt</span>
                <button onClick={copyToClipboard} className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-40 mb-4">
                {generatedPrompt}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="text-pink-500" />
                <h4 className="font-bold text-gray-700">Cevabı İşle</h4>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Gemini'den gelen JSON'ı buraya yapıştır..."
                className="w-full h-24 p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-400 outline-none"
              />

              {processingError && (
                <div className="mt-2 p-3 bg-red-50 text-red-500 text-xs rounded-lg flex gap-2 items-center">
                  <AlertTriangle size={14} /> {processingError}
                </div>
              )}
               {successMessage && (
                <div className="mt-2 p-3 bg-green-50 text-green-600 text-xs rounded-lg flex gap-2 items-center font-bold">
                  <Check size={14} /> {successMessage}
                </div>
              )}

              <button
                onClick={handleProcessResponse}
                disabled={!jsonInput}
                className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50"
              >
                Planı Uygula 🚀
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
