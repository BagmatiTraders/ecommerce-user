'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Shield, 
  Store, 
  User as UserIcon, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Edit2
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  vendor_category: string;
  created_at: string;
}

const CATEGORIES = [
  'Electronics',
  'Home & Kitchen',
  'Fashion',
  'Beauty & Care',
  'Toys & Games',
  'Sports'
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string, category?: string) => {
    const updates: any = { role: newRole };
    if (category !== undefined) updates.vendor_category = category;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      setMessage({ text: 'Error: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'User updated successfully!', type: 'success' });
      fetchUsers();
      setEditingUser(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-red-500" />;
      case 'vendor': return <Store size={14} className="text-[var(--primary)]" />;
      default: return <UserIcon size={14} className="text-[var(--text-muted)]" />;
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-[var(--text-secondary)]">Manage user roles and permissions across your platform.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 rounded-xl glass hover:bg-[var(--surface-1)] transition-all flex items-center gap-2"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Sync Users
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or email..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-[var(--surface-2)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-1)] border-b border-[var(--surface-2)]">
              <th className="p-6 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">User Details</th>
              <th className="p-6 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Role</th>
              <th className="p-6 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Vendor Category</th>
              <th className="p-6 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-2)]">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-20 text-center">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-[var(--primary)]" size={32} />
                  <div className="font-bold text-[var(--text-muted)]">Loading profiles...</div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-20 text-center">
                  <Users className="mx-auto mb-4 text-[var(--text-muted)]" size={48} strokeWidth={1} />
                  <div className="font-bold text-[var(--text-muted)]">No users found.</div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--surface-1)] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--primary)] flex-center font-bold text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-red-50 text-red-600' : 
                      user.role === 'vendor' ? 'bg-blue-50 text-[var(--primary)]' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                      {user.vendor_category || '—'}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    {editingUser?.id === user.id ? (
                      <div className="flex justify-end items-center gap-2 animate-fade-in">
                        <select 
                          className="bg-white border border-[var(--surface-2)] rounded-lg px-2 py-1 text-xs font-bold"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                        
                        {editingUser.role === 'vendor' && (
                          <select 
                            className="bg-white border border-[var(--surface-2)] rounded-lg px-2 py-1 text-xs font-bold"
                            value={editingUser.vendor_category}
                            onChange={(e) => setEditingUser({...editingUser, vendor_category: e.target.value})}
                          >
                            <option value="">No Category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                        
                        <button 
                          onClick={() => updateUserRole(user.id, editingUser.role, editingUser.vendor_category)}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingUser(null)}
                          className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-3 rounded-xl bg-[var(--surface-1)] text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
