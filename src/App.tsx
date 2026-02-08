import { useState } from 'react';
import { InventoryView } from './components/InventoryView';
import { GeneratorView } from './components/GeneratorView';
import { MealPlanView } from './components/MealPlanView';
import { SettingsView } from './components/SettingsView';
import { Refrigerator, ChefHat, CalendarDays, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'generator' | 'plan' | 'settings'>('inventory');

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'generator' && <GeneratorView />}
            {activeTab === 'plan' && <MealPlanView />}
            {activeTab === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center fixed bottom-0 w-full z-50 pb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={clsx("flex flex-col items-center gap-1", activeTab === 'inventory' ? "text-blue-600" : "text-gray-400")}
        >
          <Refrigerator size={24} />
          <span className="text-[10px] font-medium">Dolap</span>
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={clsx("flex flex-col items-center gap-1", activeTab === 'generator' ? "text-blue-600" : "text-gray-400")}
        >
          <ChefHat size={24} />
          <span className="text-[10px] font-medium">Şef</span>
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={clsx("flex flex-col items-center gap-1", activeTab === 'plan' ? "text-blue-600" : "text-gray-400")}
        >
          <CalendarDays size={24} />
          <span className="text-[10px] font-medium">Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={clsx("flex flex-col items-center gap-1", activeTab === 'settings' ? "text-blue-600" : "text-gray-400")}
        >
          <SettingsIcon size={24} />
          <span className="text-[10px] font-medium">Ayarlar</span>
        </button>
      </nav>
    </div>
  )
}

export default App
