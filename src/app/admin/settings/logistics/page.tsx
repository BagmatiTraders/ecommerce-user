'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Truck, 
  Settings, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  Percent, 
  Banknote,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin
} from 'lucide-react';

const PARTNERS = [
  { id: 'ncm', name: 'Nepal Can Move (NCM)', color: '#4338CA' },
  { id: 'pickdrop', name: 'Pick & Drop', color: '#059669' },
  { id: 'pathao', name: 'Pathao Parcel', color: '#DC2626' }
];

export default function LogisticsSettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('ecommerce_logistics_config')
        .select('*');

      if (error) throw error;
      
      const merged = PARTNERS.map(p => {
        const setting = data?.find(d => d.provider === p.id);
        return setting ? setting : {
          provider: p.id,
          is_active: p.id === 'ncm',
          discount_type: 'amount',
          discount_value: 0,
          inside_valley_charge: 100,
          outside_valley_charge: 150,
          label: p.name
        };
      });
      
      setConfigs(merged);
    } catch (e: any) {
      console.error(e);
      setConfigs(PARTNERS.map(p => ({
        provider: p.id,
        is_active: p.id === 'ncm',
        discount_type: 'amount',
        discount_value: 0,
        inside_valley_charge: 100,
        outside_valley_charge: 150,
        label: p.name
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (provider: string) => {
    setConfigs(prev => prev.map(c => ({
      ...c,
      is_active: c.provider === provider // Only one can be active
    })));
  };

  const handleUpdate = (provider: string, field: string, value: any) => {
    setConfigs(prev => prev.map(c => 
      c.provider === provider ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Upsert based on the 'provider' column
      const { error } = await supabase
        .from('ecommerce_logistics_config')
        .upsert(configs, { onConflict: 'provider' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Logistics settings saved successfully!' });
    } catch (e: any) {
      console.error(e);
      setMessage({ 
        type: 'error', 
        text: `Failed to save settings. Please ensure the "ecommerce_logistics_config" table exists.` 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-center h-screen bg-gray-50">
      <RefreshCw className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-2">
              <Settings size={12} />
              Admin Settings
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-4">
              Logistics Partners
              <Truck size={32} className="text-gray-300" />
            </h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg shadow-black/10"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border-2 animate-fade-in ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Partners Grid */}
        <div className="grid gap-6">
          {configs.map((config) => {
            const partner = PARTNERS.find(p => p.id === config.provider);
            return (
              <div 
                key={config.provider} 
                className={`bg-white rounded-[2rem] p-8 border-2 transition-all shadow-sm ${
                  config.is_active ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-gray-100 opacity-75 grayscale-[0.5]'
                }`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex-center text-white shadow-lg" style={{ backgroundColor: partner?.color }}>
                      <Truck size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{partner?.name}</h3>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        Integration: Active via Messaging App API
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleActive(config.provider)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      config.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                    }`}
                  >
                    {config.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {config.is_active ? 'Currently Active' : 'Set as Active'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                  
                  {/* Discount Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logistics Fee Discount</h4>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Type</label>
                        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl">
                          <button 
                            onClick={() => handleUpdate(config.provider, 'discount_type', 'amount')}
                            className={`flex-1 py-2 rounded-lg flex-center gap-2 font-black text-[10px] transition-all ${
                              config.discount_type === 'amount' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <Banknote size={14} /> Amount (Rs)
                          </button>
                          <button 
                            onClick={() => handleUpdate(config.provider, 'discount_type', 'percent')}
                            className={`flex-1 py-2 rounded-lg flex-center gap-2 font-black text-[10px] transition-all ${
                              config.discount_type === 'percent' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <Percent size={14} /> Percent (%)
                          </button>
                        </div>
                      </div>
                      <div className="w-32 space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Value</label>
                        <input 
                          type="number"
                          value={config.discount_value}
                          onChange={(e) => handleUpdate(config.provider, 'discount_value', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Valley Charges Section - Now in a full width row for prominence */}
                  <div className="col-span-full bg-indigo-50/30 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex-center">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black">Valley Specific Fallback Charges</h4>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Used when a customer clicks "Address Not Found"</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Inside Valley Delivery (Rs)</label>
                        <input 
                          type="number"
                          value={config.inside_valley_charge || 100}
                          onChange={(e) => handleUpdate(config.provider, 'inside_valley_charge', Number(e.target.value))}
                          className="w-full px-6 py-4 bg-white border-2 border-indigo-50 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Outside Valley Delivery (Rs)</label>
                        <input 
                          type="number"
                          value={config.outside_valley_charge || 150}
                          onChange={(e) => handleUpdate(config.provider, 'outside_valley_charge', Number(e.target.value))}
                          className="w-full px-6 py-4 bg-white border-2 border-indigo-50 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info / Preview */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">
                      <AlertCircle size={12} />
                      User Panel Preview
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400">Est. Delivery Fee:</span>
                        <span>Rs. 150</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-green-600">
                        <span>Discount ({config.discount_type === 'amount' ? `Rs. ${config.discount_value}` : `${config.discount_value}%`}):</span>
                        <span>- Rs. {config.discount_type === 'amount' ? config.discount_value : (150 * config.discount_value / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-dashed border-gray-200 pt-3">
                        <span>Final Shipping:</span>
                        <span className="text-indigo-600">Rs. {150 - (config.discount_type === 'amount' ? config.discount_value : (150 * config.discount_value / 100))}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
