import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
      <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Access Denied</h1>
      <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
        Your current account role does not have the authorization required to view this dashboard. Please check your credentials.
      </p>
      <Link href="/login">
        <Button className="mt-2 rounded-xl text-xs font-bold px-6">Back to Login</Button>
      </Link>
    </div>
  );
}
