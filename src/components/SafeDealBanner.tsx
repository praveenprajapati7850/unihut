import React from 'react';
import { ShieldCheck, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SafeDealBannerProps {
  compact?: boolean;
}

export const SafeDealBanner: React.FC<SafeDealBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-emerald-950 leading-relaxed">
          <span className="font-bold">UniHut Safe Deal: </span>
          Meet in a public campus spot (Library, Cafeteria, Main Gate). Never transfer money before inspecting in person.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
              UniHut Safe Deal Protection
            </h4>
            <p className="text-[10px] text-emerald-700 font-medium">
              Student-to-student peer safety guidelines
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
          Campus Safe
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900 font-medium">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verified campus users</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>In-app messaging</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Offer recorded in app</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Campus handover</span>
        </div>
      </div>

      <div className="pt-2 border-t border-emerald-200/60 flex items-start gap-2 text-[11px] text-stone-600 leading-snug">
        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          <strong>Campus Safety Reminder:</strong> Meet in daylight at popular campus spots. Never share passwords, OTPs, or UPI PINs.
        </span>
      </div>
    </div>
  );
};
