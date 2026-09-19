import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-mono flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-panel border border-border p-6 shadow-2xl rounded space-y-4 text-center">
        <div className="flex justify-center text-severity-critical">
          <ShieldAlert className="w-12 h-12 animate-pulse" />
        </div>
        <div className="text-xl font-bold text-accent-cyan tracking-wider">
          404 // SECTOR NOT FOUND
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          The tactical intelligence sector or coordinate path requested does not exist in the active operational database.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/60 text-accent-cyan text-xs font-bold rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO WARROOM DASHBOARD</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
