'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full">
          <Settings className="h-10 w-10 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Under Maintenance</h1>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            The security awareness console is currently deploying critical software patches. This administrative instance will return online shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
