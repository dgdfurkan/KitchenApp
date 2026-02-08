import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, RefreshCw, BarChart3, Database, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, resetDailyUsage, clearAllData } = useAppContext();

  const handleClearAll = () => {
    if (confirm("DİKKAT! Tüm verileriniz (stok, planlar, ayarlar) silinecek. Emin misiniz?")) {
      clearAllData();
      alert("Tüm veriler temizlendi.");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-500">Uygulama tercihleri ve limitler.</p>
      </header>

      <div className="space-y-6">
        {/* Usage Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50 blur-xl"></div>

          <div className="flex items-center gap-2 mb-4 text-gray-800 relative z-10">
            <BarChart3 size={20} className="text-blue-600" />
            <h3 className="font-bold text-lg">API Kullanım Durumu</h3>
          </div>

          <div className="flex items-end gap-2 mb-2 relative z-10">
            <span className="text-4xl font-black text-blue-600">{settings.usageCount}</span>
            <span className="text-gray-400 mb-1">/ ∞ (Sınırsız*)</span>
          </div>

          <p className="text-xs text-gray-500 mb-4 relative z-10">
            *Google Gemini 1.5 Flash API ücretsiz sürümü saatlik yaklaşık 15 istek limiti sunar. Bu sayaç, oluşturduğunuz prompt sayısını gösterir.
          </p>

          <button
            onClick={resetDailyUsage}
            className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors relative z-10"
          >
            <RefreshCw size={16} />
            Sayacı Sıfırla
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
            <Database size={20} className="text-red-500" />
            <h3 className="font-bold text-lg">Veri Yönetimi</h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Uygulamadaki tüm verileri (malzemeler, yemek planları vb.) kalıcı olarak siler.
          </p>

          <button
            onClick={handleClearAll}
            className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={18} />
            Tüm Verileri Temizle
          </button>
        </div>

        {/* Info */}
        <div className="text-center py-6 text-gray-400">
          <div className="flex justify-center mb-2">
            <Info size={24} className="text-gray-300" />
          </div>
          <p className="text-xs">
            Mutfak Asistanı v1.0.0
          </p>
          <p className="text-[10px] mt-1">
            React + Vite + Tailwind + Gemini
          </p>
        </div>
      </div>
    </div>
  );
};
