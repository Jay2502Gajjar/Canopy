'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, FileText, Loader2 } from 'lucide-react';
import { employeeApi } from '@/lib/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultRole?: string;
}

export function AddUserModal({ isOpen, onClose, title, defaultRole }: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: defaultRole || 'Employee',
    department: 'Engineering',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // The API endpoint handles creating the employee in Postgres
      await employeeApi.create({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        // Provide some sensible defaults since the form is simple
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        joinDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-time'
      });
      
      onClose();
      // Reset form on success
      setFormData({
        name: '', email: '', role: defaultRole || 'Employee', department: 'Engineering'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-surface-card border border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface/50">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <UserPlus size={18} className="text-primary" /> {title}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Full Name</label>
            <input
              required
              autoFocus
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g. Maya Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              required
              type="email"
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="name@canopy.io"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Role</label>
              <select
                className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Employee">Employee</option>
                <option value="HRO">HRO</option>
                <option value="HRBP">HRBP</option>
                <option value="CHRO">CHRO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Department</label>
              <select
                className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Product">Product</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
            {error && <span className="text-red-500 text-sm flex-1">{error}</span>}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : title}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
