import React, { useState } from 'react';
import {
  ShoppingBag,
  PlusCircle,
  MessageSquare,
  User,
  LogOut,
  Sparkles,
  Search,
  ShieldCheck,
  ChevronDown,
  Layers,
  RefreshCw,
  Heart,
  Bell,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { DEMO_USERS } from '../lib/seedData';
import { UniHutIcon } from './UniHutLogo';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onSearchSubmit?: (query: string) => void;
  onReseed?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onSearchSubmit,
  onReseed,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const { currentUser, userProfile, openAuthModal, logout, loginAsDemoUser } = useAuth();
  const { savedCount } = useSaved();
  const [searchVal, setSearchVal] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchVal);
      onNavigate('marketplace');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="relative group-hover:scale-105 transition-transform">
                <UniHutIcon className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-black text-2xl tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-[#A855F7] to-[#E45A8D] bg-clip-text text-transparent">Uni</span>
                    <span className="bg-gradient-to-r from-[#E45A8D] to-[#FF6B1A] bg-clip-text text-transparent">Hut</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Campus Market
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 items-center relative"
          >
            <Search className="w-4 h-4 absolute left-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search books, cycles, calc, keyboards..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100/80 hover:bg-stone-100 focus:bg-white border border-stone-200 focus:border-amber-500 rounded-full outline-none transition-all placeholder:text-stone-400"
            />
          </form>

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === 'marketplace'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Browse
            </button>

            {/* Wanted Requests Tab */}
            <button
              onClick={() => onNavigate('wanted')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'wanted'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Wanted</span>
            </button>

            {/* Saved Wishlist Button */}
            <button
              onClick={() => onNavigate('saved')}
              className={`relative px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'saved'
                  ? 'bg-pink-50 text-[#E45A8D] font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  savedCount > 0 ? 'fill-[#E45A8D] text-[#E45A8D]' : ''
                }`}
              />
              <span className="hidden sm:inline">Saved</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-pink-100 text-[#E45A8D]">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'messages' || currentTab === 'chat'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              title="Notifications Center"
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-black text-white bg-rose-600 rounded-full shadow-xs ring-1 ring-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('my-listings')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                currentTab === 'my-listings'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Listings</span>
            </button>

            {/* Sell Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  openAuthModal('login');
                } else {
                  onNavigate('create-listing');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold rounded-xl bg-unihut-gradient text-white shadow-sm shadow-pink-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Sell Item</span>
            </button>

            {/* User Profile / Auth */}
            {userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 border border-stone-200 hover:border-stone-300 rounded-full bg-white transition-all focus:outline-none"
                >
                  <span className="text-xs font-semibold text-stone-700 max-w-[80px] sm:max-w-[100px] truncate">
                    {(userProfile.displayName || userProfile.name || 'Student').split(' ')[0]}
                  </span>
                  <img
                    src={userProfile.photoURL || userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.uid || userProfile.id}`}
                    alt={userProfile.displayName || userProfile.name || 'Student'}
                    className="w-7 h-7 rounded-full object-cover bg-amber-100 ring-2 ring-white"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 mr-1" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-stone-900 truncate">
                            {userProfile.displayName || userProfile.name || 'Campus Student'}
                          </p>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {userProfile.rating && userProfile.rating > 0 ? `★ ${userProfile.rating.toFixed(1)}` : 'New Seller'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate">{userProfile.email}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{userProfile.hostelOrBlock || userProfile.college || 'Campus Student'}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('profile');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <User className="w-4 h-4 text-stone-400" />
                          <span>Student Profile & Ratings</span>
                        </button>
                        {onOpenNotifications && (
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onOpenNotifications();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Bell className="w-4 h-4 text-amber-600" />
                              <span>Notifications</span>
                            </div>
                            {unreadNotificationsCount > 0 && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                {unreadNotificationsCount}
                              </span>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('saved');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Heart className="w-4 h-4 text-[#E45A8D]" />
                            <span>Saved Items</span>
                          </div>
                          {savedCount > 0 && (
                            <span className="text-[10px] font-bold bg-pink-100 text-[#E45A8D] px-2 py-0.5 rounded-full">
                              {savedCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('my-listings');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Layers className="w-4 h-4 text-stone-400" />
                          <span>My Listed Items</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('messages');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2.5"
                        >
                          <MessageSquare className="w-4 h-4 text-stone-400" />
                          <span>Bargains & Messages</span>
                        </button>
                      </div>

                      {/* Demo Switcher Submenu */}
                      <div className="border-t border-stone-100 py-1">
                        <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                          Switch Student (Demo Mode)
                        </div>
                        {DEMO_USERS.map((demo, idx) => {
                          const demoUid = demo.uid || demo.id;
                          const demoName = demo.displayName || demo.name || 'Demo Student';
                          const isCurrent = (userProfile.uid || userProfile.id) === demoUid;
                          return (
                            <button
                              key={demoUid}
                              onClick={() => {
                                loginAsDemoUser(idx);
                                setProfileDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between hover:bg-amber-50 ${
                                isCurrent ? 'font-bold text-amber-700 bg-amber-50/50' : 'text-stone-600'
                              }`}
                            >
                              <span className="truncate">{demoName} ({demo.hostelOrBlock?.split(',')[0]})</span>
                              {isCurrent && <span className="text-[10px] text-amber-600">Active</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:inline-block px-3.5 py-1.5 text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer border border-amber-200"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
