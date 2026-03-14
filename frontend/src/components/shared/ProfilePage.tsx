'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, CheckCircle, Building2, Calendar } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

interface ProfilePageProps {
  role: string;
  userName: string;
  userEmail: string;
  userRole: string;
  department: string;
}

export function ProfilePageContent({ role, userName, userEmail, userRole, department }: ProfilePageProps) {
  const { setUser } = useAppStore();
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('+91 98765 43210');
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const verifyField = (field: 'email' | 'phone') => {
    if (field === 'email') { setEmailVerified(true); setShowEmailOtp(false); }
    else { setPhoneVerified(true); setShowPhoneOtp(false); }
    setSavedMsg(`${field === 'email' ? 'Email' : 'Phone'} verified successfully!`);
    setTimeout(() => setSavedMsg(''), 3000);
    setOtp('');
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ name });
      const user = useAppStore.getState().user;
      if (user) {
        setUser({ ...user, name: res.name, firstName: res.firstName });
      }
      setSavedMsg('Profile saved successfully!');
    } catch (err: any) {
      setSavedMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading">My Profile</h1>

      {savedMsg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-success bg-success/10 px-4 py-2.5 rounded-xl">
          <CheckCircle size={15} /> {savedMsg}
        </motion.div>
      )}

      {/* Avatar + Basic */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold flex-shrink-0 border-2 border-primary/20">
            {getInitials(name)}
          </div>
          <div className="flex-1">
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold font-heading bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors w-full max-w-sm"
              placeholder="Your Name"
            />
            <p className="text-sm text-text-muted mt-0.5">{userRole}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] font-semibold uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{role.toUpperCase()}</span>
              <span className="text-xs text-text-muted flex items-center gap-1"><Building2 size={11} /> {department}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-surface-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold font-heading">Contact Information</h3>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Company Email</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={email} onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all" />
            </div>
            {emailVerified ? (
              <span className="flex items-center gap-1 text-xs text-success font-medium bg-success/10 px-3 py-2 rounded-lg"><CheckCircle size={13} /> Verified</span>
            ) : (
              <button onClick={() => { setShowEmailOtp(true); }}
                className="text-xs font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors">Verify</button>
            )}
          </div>
          {showEmailOtp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex items-center gap-2">
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP sent to email"
                className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary" />
              <button onClick={() => verifyField('email')} className="text-xs font-medium text-white bg-primary px-3 py-2 rounded-lg hover:bg-primary-dark">Confirm</button>
            </motion.div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Phone Number</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneVerified(false); }}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm outline-none focus:border-primary transition-all" />
            </div>
            {phoneVerified ? (
              <span className="flex items-center gap-1 text-xs text-success font-medium bg-success/10 px-3 py-2 rounded-lg"><CheckCircle size={13} /> Verified</span>
            ) : (
              <button onClick={() => setShowPhoneOtp(true)}
                className="text-xs font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors">Verify</button>
            )}
          </div>
          {showPhoneOtp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 flex items-center gap-2">
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP sent to phone"
                className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-sm outline-none focus:border-primary" />
              <button onClick={() => verifyField('phone')} className="text-xs font-medium text-white bg-primary px-3 py-2 rounded-lg hover:bg-primary-dark">Confirm</button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-surface-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold font-heading">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Role', role.toUpperCase()],
            ['Department', department],
            ['Status', 'Active'],
            ['Last Login', 'Mar 14, 2026 · 10:00 AM'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-text-muted">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-3">
        <button onClick={saveProfile} disabled={isSaving}
          className={cn("px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60", isSaving && "cursor-not-allowed")}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
        <button className="px-6 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-surface transition-colors" onClick={() => setName(userName)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
