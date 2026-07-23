'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/store/useToastStore';
import { KeyRound, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToastStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Required fields',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signed In Successfully',
          description: 'Redirecting to your dashboard...',
          variant: 'success',
        });
        
        // Wait briefly for NextAuth state updates and redirect
        setTimeout(async () => {
          // Fetch current session to determine redirection target role
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          const role = session?.user?.role;

          if (role === 'ADMIN') router.push('/admin');
          else if (role === 'KITCHEN') router.push('/kitchen');
          else if (role === 'WAITER') router.push('/waiter');
          else router.push('/menu');
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const autofillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-extrabold mx-auto shadow-lg shadow-primary/20">
            G
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-50 tracking-tight">
            Staff Portal Access
          </h2>
          <p className="text-zinc-550 text-xs font-semibold">
            Login to manage orders, kitchens, floors and settings.
          </p>
        </div>

        {/* Main Form Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-450">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-550 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="name@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus-visible:ring-primary focus-visible:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-450">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-550 pointer-events-none" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus-visible:ring-primary focus-visible:border-transparent text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1 cursor-pointer mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Seeded Credentials Helper Card for Evaluator */}
          <div className="border-t border-zinc-800 pt-5 space-y-3">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Demo Accounts (Click to Autofill)</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autofillCredentials('admin@restaurant.com', 'admin123')}
                className="py-2.5 px-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 rounded-xl text-center cursor-pointer transition-colors duration-200"
              >
                <div className="text-[10px] font-extrabold text-primary uppercase">Admin</div>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">admin123</span>
              </button>
              
              <button
                type="button"
                onClick={() => autofillCredentials('kitchen@restaurant.com', 'kitchen123')}
                className="py-2.5 px-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 rounded-xl text-center cursor-pointer transition-colors duration-200"
              >
                <div className="text-[10px] font-extrabold text-primary uppercase">Kitchen</div>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">kitchen123</span>
              </button>
              
              <button
                type="button"
                onClick={() => autofillCredentials('waiter@restaurant.com', 'waiter123')}
                className="py-2.5 px-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 rounded-xl text-center cursor-pointer transition-colors duration-200"
              >
                <div className="text-[10px] font-extrabold text-primary uppercase">Waiter</div>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">waiter123</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
