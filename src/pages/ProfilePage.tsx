import React, { useState, useRef } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  Star,
  CheckCircle,
  AlertCircle,
  Calendar,
  Save,
  ShieldCheck,
  Award,
  Layers,
  Camera,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../lib/seedData';
import { VERIFIED_CAMPUS_LABEL, UNVERIFIED_CAMPUS_LABEL } from '../constants/campus';
import { compressImageFile } from '../lib/imageUtils';

export const ProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile, loginAsDemoUser } = useAuth();

  const [name, setName] = useState(userProfile?.displayName || userProfile?.name || '');
  const [college, setCollege] = useState(userProfile?.college || 'Pondicherry University');
  const [hostel, setHostel] = useState(userProfile?.hostel || userProfile?.hostelOrBlock || 'Aurobindo Hostel');
  const [phone, setPhone] = useState(userProfile?.phoneOrContact || '+91 98765 43210');
  const [bio, setBio] = useState(
    userProfile?.bio || 'Campus student. Buying & selling semester textbooks and tech gear.'
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isVerified = Boolean(userProfile?.verifiedCampus);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserProfile({
        displayName: name.trim(),
        name: name.trim(),
        college: college.trim(),
        hostel: hostel.trim(),
        hostelOrBlock: hostel.trim(),
        phoneOrContact: phone.trim(),
        bio: bio.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await compressImageFile(file, 400, 0.8);
      await updateUserProfile({
        photoURL: res.dataUrl,
        avatarUrl: res.dataUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const userPhoto =
    userProfile?.photoURL ||
    userProfile?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.uid || 'student'}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFile}
            className="hidden"
          />
          <img
            src={userPhoto}
            alt={userProfile?.displayName || userProfile?.name || 'Student'}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-amber-100 ring-4 ring-amber-100/70"
          />
          {uploadingAvatar ? (
            <div className="absolute inset-0 bg-stone-900/60 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              title="Upload new profile picture"
              className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-md border-2 border-white transition-all hover:scale-105 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
          {isVerified && !uploadingAvatar && (
            <span className="absolute top-0 right-0 bg-emerald-500 ring-2 ring-white w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs">
              ✓
            </span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {userProfile?.displayName || userProfile?.name || 'Campus Student'}
            </h1>
            
            {/* Campus Verification Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full self-center sm:self-auto ${
                isVerified
                  ? 'text-emerald-800 bg-emerald-100'
                  : 'text-amber-800 bg-amber-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerified ? VERIFIED_CAMPUS_LABEL : UNVERIFIED_CAMPUS_LABEL}</span>
            </span>
          </div>

          <p className="text-xs text-stone-500">{userProfile?.email}</p>
          <p className="text-xs text-stone-600 font-medium">
            {userProfile?.hostelOrBlock} • {userProfile?.college}
          </p>

          {/* Trust stats pill banner */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700">
              {userProfile?.rating && userProfile.rating > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{userProfile.rating.toFixed(1)} Star Rating</span>
                </>
              ) : (
                <span className="text-emerald-700 font-bold">New Seller</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userProfile?.totalSales ?? userProfile?.salesCount ?? 0} Completed Sales</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{userProfile?.totalListings ?? 0} Listings Posted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h2 className="text-lg font-bold text-stone-900">
            Edit Student Profile Information
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Your university credentials and hostel room for seamless in-person item exchanges.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile information successfully updated in Firestore!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Hostel / Hall / Room
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                College / Institute
              </label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Handover WhatsApp / Contact
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Short Bio / Year / Major
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 text-xs bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Switcher Box for Hackathon Reviewers */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Hackathon Testing Tool
          </span>
          <h3 className="text-base font-bold text-stone-900 mt-0.5">
            Switch Campus Persona (Buyer vs. Seller)
          </h3>
          <p className="text-xs text-stone-600">
            Easily toggle between student accounts to test real-time chat, making price offers, and accepting bargains:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_USERS.map((demo, idx) => (
            <button
              key={demo.uid}
              onClick={() => loginAsDemoUser(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                userProfile?.uid === demo.uid
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-amber-200'
              }`}
            >
              <img
                src={demo.photoURL}
                alt={demo.displayName}
                className="w-10 h-10 rounded-full object-cover border border-amber-300"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{demo.displayName}</p>
                <p className={`text-[10px] truncate ${userProfile?.uid === demo.uid ? 'text-amber-100' : 'text-stone-400'}`}>
                  {idx === 0 ? 'Engineering (Seller)' : idx === 1 ? 'CompSci (Buyer)' : 'Mechanical (Senior)'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
