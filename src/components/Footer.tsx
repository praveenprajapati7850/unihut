import React from 'react';
import { ShieldCheck, HeartHandshake, MapPin, RefreshCw, Zap } from 'lucide-react';
import { UniHutIcon } from './UniHutLogo';

interface FooterProps {
  onNavigateCategory?: (category: string) => void;
  onReseed?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateCategory, onReseed }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <UniHutIcon className="w-9 h-9" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-[#A855F7] to-[#E45A8D] bg-clip-text text-transparent">Uni</span>
                  <span className="bg-gradient-to-r from-[#E45A8D] to-[#FF6B1A] bg-clip-text text-transparent">Hut</span>
                </span>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-1">
                  Your Campus. Your Marketplace.
                </span>
                <span className="text-[9px] text-stone-500 font-medium tracking-wide">
                  Buy. Sell. Bargain. Connect.
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              The exclusive verified marketplace for university students. Buy, sell, bargain, and connect with students around you without WhatsApp clutter.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-time Firestore chat & bargaining</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                'Textbooks',
                'Electronics',
                'Cycles & Mobility',
                'Hostel Essentials',
                'Accessories',
                'Clothing & Merch',
              ].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onNavigateCategory && onNavigateCategory(cat)}
                    className="hover:text-amber-400 transition-colors text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Safe Campus Trading Tips */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Safety Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>Meet at public spots (Library Lawn, Cafeteria, Student Activity Center).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>Inspect items thoroughly before making UPI / cash payment.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>Never transfer money before testing electronics or cycles in person.</span>
              </li>
            </ul>
          </div>

          {/* Evaluator tools */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase">
              Hackathon Demo Tools
            </h4>
            <p className="text-[11px] text-stone-400">
              Reset database with 14 realistic Indian university student listings (books, calculator, cycles, mini fridge).
            </p>
            {onReseed && (
              <button
                onClick={onReseed}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Seed Listings</span>
              </button>
            )}
            <p className="text-[10px] text-stone-500">
              Powered by Cloud Firestore & Firebase Auth.
            </p>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 UniHut. Your Campus. Your Marketplace.</p>
          <div className="flex items-center gap-4">
            <span>Verified Student ID Only</span>
            <span>•</span>
            <span>Zero Platform Fees</span>
            <span>•</span>
            <span>Direct In-Campus Handover</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
