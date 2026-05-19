'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  Eye, 
  EyeOff,
  Filter,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  regular_price: number;
  special_price: number;
  stock_quantity: number;
  status: 'active' | 'inactive';
  category: string;
  images: string[];
  inventory_id: string;
  description: string;
}

const CATEGORIES = ['Electronics', 'Home & Kitchen', 'Fashion', 'Beauty & Care', 'Toys & Games', 'Sports', 'General'];

export default function AdminProducts({ 
  isVendor = false, 
  vendorCategory = '' 
}: { 
  isVendor?: boolean; 
  vendorCategory?: string; 
} = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    regular_price: 0,
    special_price: 0,
    stock_quantity: 0,
    category: '',
    status: 'active',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ecommerce_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk Actions (Debug Mode)
  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      const { error } = await supabase
        .from('ecommerce_products')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        console.error(`Failed to update ${id}:`, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    alert(`Bulk Update Complete\nSuccess: ${successCount}\nFailed: ${failCount}`);
    fetchProducts();
    setSelectedIds(new Set());
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0 || !confirm(`Are you sure you want to permanently delete ${count} products?`)) return;
    setLoading(true);
    
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      const { error } = await supabase
        .from('ecommerce_products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Failed to delete ${id}:`, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    alert(`Bulk Delete Complete\nSuccess: ${successCount}\nFailed: ${failCount}`);
    fetchProducts();
    setSelectedIds(new Set());
    setLoading(false);
  };

  // Individual Actions
  const handleStatusToggle = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('ecommerce_products')
      .update({ status: newStatus })
      .eq('id', product.id);

    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus as any } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('ecommerce_products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      display_name: product.display_name,
      regular_price: product.regular_price || 0,
      special_price: product.special_price || 0,
      stock_quantity: product.stock_quantity || 0,
      category: product.category || 'General',
      status: product.status,
      description: product.description || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    
    const { error } = await supabase
      .from('ecommerce_products')
      .update(editForm)
      .eq('id', editingProduct.id);

    if (error) {
      setMessage({ text: 'Update failed: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Product updated successfully!', type: 'success' });
      setTimeout(() => {
        setEditingProduct(null);
        fetchProducts();
      }, 1000);
    }
    setSubmitting(false);
  };

  const filteredProducts = products.filter(p => 
    p.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.inventory_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Store Products</h1>
            <p className="text-[var(--text-muted)] font-medium">Manage your catalog, pricing, and stock levels.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 animate-fade-in bg-amber-50 p-2 rounded-2xl border border-amber-100">
                <span className="text-xs font-black px-3 text-amber-700">{selectedIds.size} SELECTED</span>
                <button 
                  onClick={() => handleBulkStatus('active')}
                  className="px-4 py-2 rounded-xl bg-white text-green-600 text-xs font-bold shadow-sm hover:bg-green-50"
                >
                  Bulk Active
                </button>
                <button 
                  onClick={() => handleBulkStatus('inactive')}
                  className="px-4 py-2 rounded-xl bg-white text-amber-600 text-xs font-bold shadow-sm hover:bg-amber-50"
                >
                  Bulk Inactive
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700"
                >
                  Bulk Delete
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="p-2 text-[var(--text-muted)] hover:text-black">
                  <X size={16} />
                </button>
              </div>
            )}
            <Link href="/admin/inventory" className="btn-secondary py-4 px-6 flex items-center gap-2">
              <Package size={18} />
              Sync Inventory
            </Link>
          </div>
        </div>

        <div className="premium-card overflow-hidden !p-0 border border-[var(--surface-2)]">
          <div className="p-6 border-b border-[var(--surface-2)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-[var(--surface-2)]">
                  <th className="p-6 w-12">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Product</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">ID</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Pricing</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Stock</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-2)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Loader2 className="animate-spin inline-block text-[var(--primary)]" />
                    </td>
                  </tr>
                ) : filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.has(product.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="p-6">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-center overflow-hidden border border-[var(--surface-2)] shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm mb-0.5 group-hover:text-[var(--primary)] transition-colors">{product.display_name}</div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--surface-1)] px-2 py-1 rounded-md">
                        {product.inventory_id || 'LOCAL-ID'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black">${product.special_price > 0 ? product.special_price : product.regular_price}</span>
                          {product.special_price > 0 && product.special_price < product.regular_price && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Sale</span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-[var(--text-muted)] line-through">Reg: ${product.regular_price}</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col items-center">
                        <div className={`text-sm font-black ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-black'}`}>
                          {product.stock_quantity}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => handleStatusToggle(product)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            product.status === 'active' 
                              ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' 
                              : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                          }`}
                        >
                          {product.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                          {product.status}
                        </button>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--surface-2)] transition-all text-[var(--text-secondary)] hover:text-[var(--primary)]"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-3 rounded-xl hover:bg-red-50 transition-all text-[var(--text-muted)] hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative">
            <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-all">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <Edit2 className="text-[var(--primary)]" />
              Edit Product
            </h2>
            
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Category</label>
                  <select 
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Reg. Price</label>
                    <input 
                      type="number" 
                      value={editForm.regular_price}
                      onChange={(e) => setEditForm({...editForm, regular_price: Number(e.target.value)})}
                      className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Spec. Price</label>
                    <input 
                      type="number" 
                      value={editForm.special_price}
                      onChange={(e) => setEditForm({...editForm, special_price: Number(e.target.value)})}
                      className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Stock Quantity</label>
                  <input 
                    type="number" 
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({...editForm, stock_quantity: Number(e.target.value)})}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Description</label>
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] h-48 resize-none font-medium text-sm leading-relaxed"
                  />
                </div>

                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-2">
                    <AlertCircle size={14} />
                    Auto-Sync
                  </div>
                  <p className="text-[10px] font-bold text-blue-700 leading-normal">
                    Changes made here only affect the storefront. Your original warehouse inventory data remains unchanged.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 rounded-2xl bg-black text-white font-bold hover:bg-gray-800 transition-all flex-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
            
            {message.text && (
              <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="text-sm font-bold">{message.text}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
