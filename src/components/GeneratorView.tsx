import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, Calendar, ArrowRight, Settings2, Link as LinkIcon, AlertTriangle, Snowflake, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as Slider from '@radix-ui/react-slider';
import { animations } from '../utils/animations';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface BatchLink {
  fromDay: number; // 1-based index
  toDay: number;
}

export const GeneratorView: React.FC = () => {
  const { inventory, setWeeklyPlan, incrementUsage } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Advanced Form State
  const [days, setDays] = useState(3);
  const [people] = useState(2);
  const [prepTimeRange, setPrepTimeRange] = useState([15, 60]); // Min - Max
  const [calories] = useState('Standart');
  const [cuisine, setCuisine] = useState<string[]>(['Türk Mutfağı']);
  const [mood, setMood] = useState<string[]>(['Pratik ve Hızlı']); // Now array
  const [equipment, setEquipment] = useState<string[]>(['Ocak', 'Fırın']);
  const [batchLinks, setBatchLinks] = useState<BatchLink[]>([]);
  const [isFreezerPrep, setIsFreezerPrep] = useState(false);

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
- Mod: ${isFreezerPrep ? 'DONDURUCU HAZIRLIĞI (Freezer Prep)' : 'GÜNLÜK YEMEK PLANLAMA'}
- Süre: ${days} Günlük Plan
- Kişi Sayısı: ${people}
- Hazırlık Süresi Aralığı: ${prepTimeRange[0]} dk - ${prepTimeRange[1]} dk
- Kalori Hedefi: ${calories}
- Mutfak Tercihi: ${cuisine.join(', ')}
- Yemek Modu: ${mood.join(', ')}
- Mutfak Ekipmanları: ${equipment.join(', ')}

${isFreezerPrep ? `
DONDURUCU ODAKLI GÖREV:
Amacımız bu malzemeleri kullanarak dondurucuya atılabilecek yemekler hazırlamak.
Lütfen her tarif için şunları belirt:
1. "Pişirmeden At" (Çiğ Hazırlık) veya "Pişirip At" (Yemek Hazırlığı)
2. Dondurucudan çıkarınca nasıl ısıtılacak/pişirilecek?
` : `
TOPLU PİŞİRME (BATCH COOKING) PLANI:
${batchSchedule ? batchSchedule : "Her gün taze yemek yapılacak."}
(Eğer "Dünden Kalan" işaretliyse, o gün yemek pişirilmeyecek, önceki günün yemeği ısıtılıp yenecek. Porsiyonları buna göre hesapla.)
`}

ÇIKTI FORMATI (JSON):
SADECE aşağıdaki JSON şemasını döndür. Markdown yok. Yorum satırı yok.
{
  "days": [
    {
      "day": "Gün 1 / Porsiyon 1",
      "meals": [
        {
          "name": "Yemek İsmi",
          "description": "Kısa, iştah açıcı açıklama.",
          "recipe": "Adım adım detaylı tarif. ${isFreezerPrep ? 'Dondurma ve Çözdürme talimatlarını da ekle.' : ''}",
          "ingredientsUsed": [
            { "name": "Malzeme", "amount": 0.5, "unit": "kg" }
          ],
          "isLeftover": false,
          "prepTime": "45 dk",
          "calories": "500 kcal",
          "freezerInstructions": "${isFreezerPrep ? 'Dondurma talimatı...' : ''}"
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

      // Add IDs if missing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.days.forEach((day: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        day.meals = day.meals.map((m: any) => ({ ...m, id: m.id || crypto.randomUUID() }));
      });

      setWeeklyPlan({ days: data.days });

      // We do NOT deduct inventory here anymore.
      // Only set success message.
      setSuccessMessage(`Harika! Plan yüklendi. Yemekleri yaptıkça stoktan düşebilirsin.`);
      setJsonInput('');
    } catch (e) {
      setProcessingError("JSON Hatası: Lütfen Gemini cevabını olduğu gibi yapıştırın.");
      console.error(e);
    }
  };

  return (
    <div className="p-4 pb-28 max-w-lg mx-auto min-h-screen">
      <header className="mb-8 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 mb-1">
            {isFreezerPrep ? 'Buzhane Şefi ❄️' : 'Şefin Stüdyosu 👨‍🍳'}
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
            {isFreezerPrep ? 'Dondurucu Hazırlığı & Saklama' : 'Haftalık Yemek Planlama'}
          </p>
        </div>
        <button
          onClick={() => setIsFreezerPrep(!isFreezerPrep)}
          className={cn(
            "p-3 rounded-2xl shadow-lg transition-all",
            isFreezerPrep ? "bg-cyan-500 text-white shadow-cyan-200" : "bg-white text-gray-400 shadow-sm hover:text-violet-500"
          )}
          title={isFreezerPrep ? "Normal Moda Dön" : "Dondurucu Moduna Geç"}
        >
          {isFreezerPrep ? <Calendar size={24} /> : <Snowflake size={24} />}
        </button>
      </header>

      <motion.div
        variants={animations.container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* DAY SLIDER & BATCH LINKER (Only in Meal Plan Mode) */}
        {!isFreezerPrep && (
          <motion.section variants={animations.item} className="glass-panel p-6 rounded-3xl border border-white/60">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Calendar className="text-violet-500" size={20} />
                Zaman Çizelgesi
              </h3>
              <span className="text-xl font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-lg border border-violet-100">
                {days} Gün
              </span>
            </div>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5 mb-8"
              value={[days]}
              max={7}
              min={1}
              step={1}
              onValueChange={(val) => { setDays(val[0]); setBatchLinks([]); }}
            >
              <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                <Slider.Range className="absolute bg-gradient-to-r from-violet-500 to-pink-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-6 h-6 bg-white border-2 border-violet-500 shadow-lg rounded-full focus:outline-none focus:scale-110 transition-transform" />
            </Slider.Root>

            {/* Visual Day Linker */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
              {Array.from({ length: days }).map((_, i) => {
                const dayNum = i + 1;
                const link = batchLinks.find(l => l.toDay === dayNum);
                const isSource = batchLinks.some(l => l.fromDay === dayNum);

                return (
                  <div key={dayNum} className="relative group">
                    {/* Link Connector Line */}
                    {link && (
                      <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        className="absolute -left-4 top-1/2 w-4 h-[2px] bg-orange-300 z-0 origin-left"
                      />
                    )}

                    <button
                      onClick={() => handleBatchLink(dayNum)}
                      disabled={dayNum === 1}
                      className={cn(
                        "relative z-10 w-16 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95",
                        link
                          ? "bg-orange-50 border-orange-400 text-orange-600"
                          : isSource
                            ? "bg-violet-50 border-violet-400 text-violet-700"
                            : "bg-white border-gray-100 text-gray-400 hover:border-violet-200 hover:text-gray-600"
                      )}
                    >
                      <span className="text-[10px] font-bold tracking-wider opacity-60">GÜN</span>
                      <span className="text-2xl font-black">{dayNum}</span>

                      {link ? (
                        <div className="flex items-center gap-1 text-[9px] font-bold bg-orange-100 px-1.5 py-0.5 rounded-full text-orange-600">
                          <LinkIcon size={8} /> BAĞLI
                        </div>
                      ) : dayNum > 1 ? (
                        <span className="text-[9px] opacity-0 group-hover:opacity-50 transition-opacity">
                          Bağla
                        </span>
                      ) : (
                        <span className="text-[9px] opacity-30">Başlangıç</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* TIME & PREP SETTINGS */}
        <motion.section variants={animations.item} className="glass-panel p-6 rounded-3xl border border-white/60 space-y-6">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Süre & Kısıtlar
          </h3>

          <div>
            <div className="flex justify-between mb-4 text-sm font-medium text-gray-600">
              <span>Hazırlık Süresi (Dk)</span>
              <span className="text-blue-600 font-bold">{prepTimeRange[0]} - {prepTimeRange[1]} dk</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={prepTimeRange}
              max={180}
              min={15}
              step={15}
              minStepsBetweenThumbs={1}
              onValueChange={setPrepTimeRange}
            >
              <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-500 shadow-md rounded-full focus:outline-none" />
              <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-500 shadow-md rounded-full focus:outline-none" />
            </Slider.Root>
          </div>
        </motion.section>

        {/* SMART FILTERS */}
        <motion.section variants={animations.item} className="glass-panel p-6 rounded-3xl border border-white/60 space-y-6">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Settings2 className="text-pink-500" size={20} />
            Akıllı Tercihler
          </h3>

          {/* Cuisine */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mutfak</label>
            <div className="flex flex-wrap gap-2">
              {['Türk Mutfağı', 'İtalyan', 'Uzak Doğu', 'Akdeniz', 'Sürpriz'].map(c => (
                <button
                  key={c}
                  onClick={() => toggleSelection(cuisine, c, setCuisine)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm",
                    cuisine.includes(c)
                      ? "bg-violet-600 text-white border-violet-600 shadow-violet-200 scale-105"
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Mood (Multiple) */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mod (Çoklu Seçim)</label>
            <div className="grid grid-cols-2 gap-2">
              {['Pratik ve Hızlı', 'Ziyafet Sofrası', 'Diyet / Hafif', 'Anne Yemeği (Comfort)', 'Gurme', 'Ekonomik'].map(m => (
                <button
                  key={m}
                  onClick={() => toggleSelection(mood, m, setMood)}
                  className={cn(
                    "px-3 py-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between group",
                    mood.includes(m)
                      ? "bg-pink-500 text-white border-pink-500 shadow-pink-200"
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  {m}
                  {mood.includes(m) && <Check size={14} className="opacity-80" />}
                </button>
              ))}
            </div>
          </div>

           {/* Equipment */}
           <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Ekipman</label>
            <div className="flex flex-wrap gap-2">
              {['Ocak', 'Fırın', 'Airfryer', 'Düdüklü', 'Blender', 'Izgara'].map(eq => (
                <button
                  key={eq}
                  onClick={() => toggleSelection(equipment, eq, setEquipment)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                    equipment.includes(eq)
                      ? "bg-gray-800 text-white border-gray-800 shadow-lg"
                      : "bg-white text-gray-400 border-gray-100"
                  )}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Generate Action */}
        <motion.button
          variants={animations.item}
          whileHover={animations.hover}
          whileTap={animations.tap}
          onClick={generatePrompt}
          className="w-full py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-2xl shadow-xl shadow-violet-500/30 flex items-center justify-center gap-3 text-lg font-bold relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Sparkles className="animate-pulse" />
          {isFreezerPrep ? 'Buzhane Planını Oluştur' : 'Sihirli Menüyü Oluştur'}
        </motion.button>

        {/* Prompt Output */}
        <AnimatePresence>
          {generatedPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-panel p-4 rounded-3xl border-2 border-violet-100"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Gemini Prompt</span>
                <button onClick={copyToClipboard} className="p-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-40 mb-4 shadow-inner">
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
                className="w-full h-24 p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-400 outline-none transition-shadow shadow-sm"
              />

              {processingError && (
                <div className="mt-2 p-3 bg-red-50 text-red-500 text-xs rounded-lg flex gap-2 items-center border border-red-100">
                  <AlertTriangle size={14} /> {processingError}
                </div>
              )}
               {successMessage && (
                <div className="mt-2 p-3 bg-green-50 text-green-600 text-xs rounded-lg flex gap-2 items-center font-bold border border-green-100">
                  <Check size={14} /> {successMessage}
                </div>
              )}

              <button
                onClick={handleProcessResponse}
                disabled={!jsonInput}
                className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-black transition-colors shadow-lg"
              >
                Planı Uygula 🚀
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
