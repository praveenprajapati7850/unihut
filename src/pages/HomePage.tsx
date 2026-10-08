import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Laptop,
  Bike,
  Home,
  Watch,
  Shirt,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  CheckCircle,
  Clock,
  IndianRupee,
  Wrench,
  Package,
  Flame,
  Megaphone,
  ShoppingBag,
  Mic,
} from 'lucide-react';
import { Listing, ListingCategory, WantedPost } from '../types';
import { ListingCard } from '../components/ListingCard';
import { VERIFIED_CAMPUS_LABEL } from '../constants/campus';
import { UniHutIcon } from '../components/UniHutLogo';
import { subscribeToWantedPosts } from '../lib/marketplaceService';
import { AiVoiceSearchModal } from '../components/AiVoiceSearchModal';

interface HomePageProps {
  listings: Listing[];
  onNavigate: (tab: string, param?: string) => void;
  onSelectListing: (listingId: string) => void;
  onSelectCategory: (category: ListingCategory) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  listings,
  onNavigate,
  onSelectListing,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('marketplace', searchQuery);
  };

  // Exact categories:
  // Textbooks, Electronics, Cycles & Mobility, Hostel Essentials, Accessories, Clothing & Merch, Services, Other
  const categories: { name: ListingCategory; icon: React.ReactNode; count: number; color: string }[] = [
    {
      name: 'Textbooks',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      count: listings.filter((l) => l.category === 'Textbooks').length,
      color: 'bg-blue-50 border-blue-200/80 hover:border-blue-400',
    },
    {
      name: 'Electronics',
      icon: <Laptop className="w-5 h-5 text-purple-600" />,
      count: listings.filter((l) => l.category === 'Electronics').length,
      color: 'bg-purple-50 border-purple-200/80 hover:border-purple-400',
    },
    {
      name: 'Cycles & Mobility',
      icon: <Bike className="w-5 h-5 text-emerald-600" />,
      count: listings.filter((l) => l.category === 'Cycles & Mobility').length,
      color: 'bg-emerald-50 border-emerald-200/80 hover:border-emerald-400',
    },
    {
      name: 'Hostel Essentials',
      icon: <Home className="w-5 h-5 text-amber-600" />,
      count: listings.filter((l) => l.category === 'Hostel Essentials').length,
      color: 'bg-amber-50 border-amber-200/80 hover:border-amber-400',
    },
    {
      name: 'Accessories',
      icon: <Watch className="w-5 h-5 text-rose-600" />,
      count: listings.filter((l) => l.category === 'Accessories').length,
      color: 'bg-rose-50 border-rose-200/80 hover:border-rose-400',
    },
    {
      name: 'Clothing & Merch',
      icon: <Shirt className="w-5 h-5 text-teal-600" />,
      count: listings.filter((l) => l.category === 'Clothing & Merch').length,
      color: 'bg-teal-50 border-teal-200/80 hover:border-teal-400',
    },
    {
      name: 'Services',
      icon: <Wrench className="w-5 h-5 text-indigo-600" />,
      count: listings.filter((l) => l.category === 'Services').length,
      color: 'bg-indigo-50 border-indigo-200/80 hover:border-indigo-400',
    },
    {
      name: 'Other',
      icon: <Package className="w-5 h-5 text-stone-600" />,
      count: listings.filter((l) => l.category === 'Other').length,
      color: 'bg-stone-50 border-stone-200/80 hover:border-stone-400',
    },
  ];

  const featuredListings = listings.slice(0, 4);
  const recentListings = listings.slice(4, 10);

  // Feature 7: Campus Deals (real listings with originalPrice > price)
  const campusDeals = listings
    .filter((l) => l.status === 'available' && l.originalPrice && l.originalPrice > l.price)
    .sort((a, b) => {
      const discA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
      const discB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
      return discB - discA;
    })
    .slice(0, 4);

  // Feature 6: Active student wanted posts
  const [wantedPosts, setWantedPosts] = useState<WantedPost[]>([]);

  React.useEffect(() => {
    const unsub = subscribeToWantedPosts((items) => {
      setWantedPosts(items.slice(0, 3));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/40 via-pink-50/15 to-stone-50/30 pt-10 pb-16 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Brand Logo & Campus Pill Badge */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:border-pink-200 transition-colors">
                <UniHutIcon className="w-8 h-8" />
                <div className="flex items-center gap-2 text-left">
                  <span className="font-black text-xl tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-[#A855F7] to-[#E45A8D] bg-clip-text text-transparent">Uni</span>
                    <span className="bg-gradient-to-r from-[#E45A8D] to-[#FF6B1A] bg-clip-text text-transparent">Hut</span>
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="text-xs font-bold text-stone-700 tracking-wide">
                    {VERIFIED_CAMPUS_LABEL}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <span>Buy. Sell. Bargain. Connect.</span>
                <span className="text-stone-300">•</span>
                <span>Built for students</span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
              Your Campus. <br />
              <span className="bg-gradient-to-r from-[#FF6B1A] via-[#E45A8D] to-[#A855F7] bg-clip-text text-transparent">
                Your Marketplace.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 font-normal max-w-2xl mx-auto leading-relaxed">
              Buy, sell, bargain and connect with students around you.
            </p>

            {/* Large Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto relative flex items-center shadow-lg shadow-pink-500/5 rounded-2xl bg-white border-2 border-stone-200 focus-within:border-pink-500 transition-all p-1.5"
            >
              <Search className="w-5 h-5 text-stone-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="What are you looking for? (e.g. calculator, cycle, maths books, kettle)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 text-sm sm:text-base text-stone-900 bg-transparent outline-none placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={() => setIsVoiceSearchOpen(true)}
                title="AI Voice Search"
                className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl mr-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Mic className="w-5 h-5 text-rose-500" />
              </button>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#E45A8D] hover:opacity-95 active:scale-95 text-white font-bold text-sm tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Find Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Action Buttons: Explore UniHut + Sell an Item */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="px-6 py-2.5 rounded-xl bg-unihut-gradient bg-unihut-gradient-hover text-white font-bold text-sm shadow-md shadow-pink-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Explore UniHut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('create-listing')}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Sell an Item</span>
              </button>
            </div>

            {/* Quick Stat Tags */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-medium text-stone-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>2,500+ Students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Zero Commission</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{VERIFIED_CAMPUS_LABEL}</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Browse by Campus Category
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Everything passed down from seniors to freshers
            </p>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({listings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between cursor-pointer ${cat.color}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-xs leading-snug">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-stone-500 font-medium">
                  {cat.count} items
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Featured Campus Deals
              </h2>
              <p className="text-xs text-stone-500">Popular items priced for quick clearance</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>See more</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onClick={onSelectListing}
            />
          ))}
        </div>
      </section>

      {/* FEATURE 7: CAMPUS DEALS SECTION (Only if real discounted listings exist) */}
      {campusDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <span>🔥 Campus Deals</span>
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                    Big Savings
                  </span>
                </h2>
                <p className="text-xs text-stone-500">
                  Verified price drops on real campus textbooks, calculators & essentials
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {campusDeals.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onClick={onSelectListing}
              />
            ))}
          </div>
        </section>
      )}

      {/* FEATURE 6: STUDENT REQUESTS (WANTED POSTS) SECTION */}
      {wantedPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                    📢 Students Are Looking For
                  </h2>
                  <p className="text-xs text-stone-600">
                    Got any of these items in your hostel? Sell them to a fellow classmate today!
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('wanted')}
                className="self-start sm:self-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View All Student Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wantedPosts.map((wp) => (
                <div
                  key={wp.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                        {wp.category}
                      </span>
                      <span className="text-xs font-black text-stone-900">
                        Budget ₹{wp.budget.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-sm leading-snug line-clamp-1">
                      {wp.title}
                    </h4>
                    {wp.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-2">
                        {wp.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">
                      Condition: {wp.condition}
                    </span>
                    <button
                      onClick={() => onNavigate('wanted')}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3 text-amber-600" />
                      <span>I Have This</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS - 3 STEPS */}
      <section className="bg-stone-50 border-y border-stone-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-3 tracking-tight">
              How UniHut Works
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Friction-free student-to-student marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">
                Snap & List in 60 Seconds
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Take a photo of your pre-loved book, cycle, or hostel gadget. Set your asking price, specify if you are open to bargaining, and list your hostel block.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 font-black text-xl flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">
                Chat & Bargain Directly
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Interested buyers message you in real-time. Make and accept price offers directly through chat without giving away your personal phone number upfront.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-xl flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1.5">
                Walk & Handover on Campus
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Meet up at the Central Library, hostel mess, or cafeteria. Inspect the item, complete the exchange, and celebrate a hassle-free deal!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENTLY ADDED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Recently Added on Campus
              </h2>
              <p className="text-xs text-stone-500">Fresh listings posted by seniors and peers</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onClick={onSelectListing}
            />
          ))}
        </div>
      </section>

      {/* TRUST & SAFETY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Campus Safety Guarantee
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              A Safer Marketplace Built For College Students
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Every seller profile shows verified campus membership and student status. Keep all communications and offer bargaining inside UniHut to ensure a safe exchange.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-2 rounded-xl border border-stone-700">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{VERIFIED_CAMPUS_LABEL} Community</span>
              </div>
              <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-2 rounded-xl border border-stone-700">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Real-Time In-Chat Bargaining</span>
              </div>
              <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-2 rounded-xl border border-stone-700">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero Commission In-Person Handover</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Voice Search Modal */}
      <AiVoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        listings={listings}
        onApplySearch={(query) => {
          onNavigate('marketplace', query);
        }}
      />

    </div>
  );
};
