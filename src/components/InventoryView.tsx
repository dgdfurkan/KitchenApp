import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseIngredientInput } from '../utils/parser';
import type { Ingredient } from '../types';

export const InventoryView: React.FC = () => {
  const { inventory, setInventory } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

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
    <div className="p-4 pb-24 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Malzemelerim</h1>
        <p className="text-sm text-gray-500">Elinizdeki malzemeleri girin.</p>
      </header>

      {/* Add Ingredient Button/Area */}
      <div className="mb-6">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Plus size={20} />
            Malzeme Ekle
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow-lg border border-gray-100"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Örnek:&#10;2 kg domates&#10;500g kıyma&#10;Tuz"
              className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-3 text-gray-700"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={handleAddIngredients}
                className="flex-1 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Inventory List */}
      <ul className="space-y-3">
        <AnimatePresence>
          {inventory.map(item => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
            >
              {editingId === item.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={editForm.amount || ''}
                    onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    className="w-16 p-1 border rounded"
                    placeholder="Miktar"
                  />
                  <input
                    type="text"
                    value={editForm.unit || ''}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-16 p-1 border rounded"
                    placeholder="Birim"
                  />
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 p-1 border rounded"
                    placeholder="İsim"
                  />
                  <button onClick={saveEdit} className="text-green-600 p-1"><Check size={18} /></button>
                  <button onClick={cancelEdit} className="text-red-500 p-1"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {item.amount > 0 ? item.amount : '-'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 capitalize">{item.name}</h3>
                      <p className="text-xs text-gray-400">{item.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
        {inventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-gray-400"
          >
            Henüz malzeme eklenmedi.
          </motion.div>
        )}
      </ul>
    </div>
  );
};
