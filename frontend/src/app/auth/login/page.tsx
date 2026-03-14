'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Sun, Moon, ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { authApi } from '@/lib/api';

const presetUsers = [];

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, toggleTheme, initTheme } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { initTheme(); }, [initTheme]);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password } as any);
      if (res.requires2FA) {
        setUserId(res.userId);
        setStep('otp');
        setSuccessMsg(res.message);
      } else {
        const role = res.user?.role || 'hro';
        router.push(`/${role}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6 || !userId) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await authApi.verifyOtp({ userId, code: otpCode });
      const role = res.user?.role || 'hro';
      router.push(`/${role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (preset: any) => {
    // Disabled
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <button onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-card border border-border transition-colors"
        aria-label="Toggle theme">
        {resolvedTheme === 'dark' ? <Sun size={18} className="text-text-muted" /> : <Moon size={18} className="text-text-muted" />}
      </button>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] relative z-10">
        <div className="bg-surface-card border border-border rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Image src="/canopy-logo.png" alt="Canopy" width={48} height={48} className="mx-auto mb-3 rounded-xl" />
            <h1 className="text-2xl font-bold font-heading">Welcome to Canopy</h1>
            <p className="text-sm text-text-muted mt-1">{step === 'login' ? 'Sign in to access your HR intelligence' : 'Two-Factor Authentication'}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger text-center">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-xl text-sm text-success text-center">
              {successMsg}
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@canopy.io"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className={cn(
                  'w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm',
                  'hover:bg-primary-dark transition-all flex items-center justify-center gap-2',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}>
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">6-Digit Code</label>
                <input id="otp" type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                  className="w-full h-11 px-4 text-center tracking-[0.5em] text-lg font-bold rounded-xl bg-surface border border-border placeholder:font-normal placeholder:tracking-normal placeholder:text-sm placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep('login'); setError(''); setSuccessMsg(''); }} disabled={isLoading}
                  className="flex-shrink-0 px-4 h-11 rounded-xl bg-surface border border-border text-sm font-semibold hover:bg-surface-card transition-colors">
                  Back
                </button>
                <button type="submit" disabled={isLoading}
                  className={cn(
                    'flex-1 h-11 rounded-xl bg-primary text-white font-semibold text-sm',
                    'hover:bg-primary-dark transition-all flex items-center justify-center gap-2',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}>
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verify Access'}
                </button>
              </div>
            </form>
          )}
          
          {/* Quick Login Removed */}
        </div>
        <p className="text-center text-xs text-text-muted mt-4">Canopy · AI-Powered HR Intelligence · 2026</p>
      </motion.div>
    </div>
  );
}
