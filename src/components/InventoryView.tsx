import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Search, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseIngredientInput } from '../utils/parser';
import type { Ingredient } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const InventoryView: React.FC = () => {
  const { inventory, setInventory } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddIngredients = () => {
    if (!inputText.trim()) return;
    const newIngredients = parseIngredientInput(inputText);
    setInventory(prev => [...prev, ...newIngredients]);
    setInputText('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const startEdit = (item: Ingredient) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const saveEdit = () => {
    if (editingId && editForm.name) {
      setInventory(prev => prev.map(item =>
        item.id === editingId ? { ...item, ...editForm } as Ingredient : item
      ));
      setEditingId(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto min-h-screen">
      <header className="mb-8 pt-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-500 mb-2"
        >
          Sihirli Kiler 🥕
        </motion.h1>
        <p className="text-gray-500 text-sm">Eldeki malzemeleri yaz, şef büyü yapsın.</p>
      </header>

      {/* Search & Add Bar */}
      <div className="flex gap-2 mb-6 sticky top-2 z-10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 backdrop-blur border border-white/40 shadow-sm focus:ring-2 focus:ring-violet-400 outline-none text-gray-700 transition-all"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "p-3 rounded-2xl shadow-lg transition-all text-white",
            isAdding ? "bg-red-500 rotate-45" : "bg-gradient-to-tr from-violet-600 to-pink-500"
          )}
        >
          <Plus size={24} />
        </motion.button>
      </div>

      {/* Add Ingredient Modal/Area */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.9 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.9 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-xl ring-1 ring-black/5">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Örnek:&#10;2 kg domates&#10;500g kıyma&#10;Tuz, Karabiber"
                className="w-full h-32 p-4 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none resize-none mb-4 text-gray-700 font-medium placeholder:text-gray-400"
                autoFocus
              />
              <button
                onClick={handleAddIngredients}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all active:scale-[0.98]"
              >
                Malzemeleri Ekle ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory List */}
      <motion.ul layout className="space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredInventory.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              layout
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white/60 hover:bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {editingId === item.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={editForm.amount || ''}
                    onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    className="w-16 p-2 bg-white rounded-lg border border-gray-200 text-center"
                    placeholder="#"
                  />
                  <input
                    type="text"
                    value={editForm.unit || ''}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-16 p-2 bg-white rounded-lg border border-gray-200 text-center"
                    placeholder="Birim"
                  />
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 p-2 bg-white rounded-lg border border-gray-200"
                    placeholder="İsim"
                  />
                  <button onClick={saveEdit} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"><Check size={18} /></button>
                  <button onClick={cancelEdit} className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-violet-600 font-bold shadow-inner border border-white">
                      {item.amount > 0 ? (
                        <div className="text-center leading-none">
                          <span className="text-lg block">{item.amount}</span>
                          <span className="text-[10px] opacity-70 uppercase">{item.unit}</span>
                        </div>
                      ) : (
                        <Sparkles size={16} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize text-lg">{item.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>

        {inventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-white/50 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🍎</span>
            </div>
            <p className="text-gray-500 font-medium">Dolap boş, şef aç!</p>
            <p className="text-sm text-gray-400 mt-2">Sağ üstteki + butonuna bas.</p>
          </motion.div>
        )}
      </motion.ul>
    </div>
  );
};
