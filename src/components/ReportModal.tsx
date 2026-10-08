import React, { useState } from 'react';
import { X, Flag, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../lib/marketplaceService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: 'listing' | 'user';
  targetId: string;
  targetTitleOrName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetTitleOrName,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  
  // Exact reasons specified in requirement:
  // Scam / suspicious, Wrong information, Prohibited item, Offensive content, Other
  const reasons = [
    'Scam / suspicious',
    'Wrong information',
    'Prohibited item',
    'Offensive content',
    'Other',
  ];

  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) {
      openAuthModal('login');
      return;
    }

    const reporterId = currentUser?.uid || userProfile?.uid || userProfile?.id || 'anonymous_reporter';

    setLoading(true);
    setError(null);

    try {
      await submitReport(
        targetId,
        reporterId,
        reason,
        description
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2200);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Report Listing
              </h3>
              <p className="text-[11px] text-stone-500 truncate max-w-[240px]">
                {targetTitleOrName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">
                Thanks. Your report has been submitted.
              </h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Reason for Report *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-rose-500 outline-none font-medium cursor-pointer"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide any additional details to help campus moderators investigate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-rose-500 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Reports are confidential and reviewed by campus safety ambassadors.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {loading ? 'Submitting Report...' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
