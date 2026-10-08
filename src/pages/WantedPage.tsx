import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { WantedPost, ListingCategory } from '../types';
import {
  subscribeToWantedPosts,
  createWantedPost,
  deleteWantedPost,
  updateWantedPostStatus,
} from '../lib/marketplaceService';
import { useAuth } from '../context/AuthContext';

interface WantedPageProps {
  onIHaveThis: (post: WantedPost) => void;
  onExploreMarketplace: () => void;
}

const CATEGORIES: ListingCategory[] = [
  'Textbooks',
  'Electronics',
  'Cycles & Mobility',
  'Hostel Essentials',
  'Accessories',
  'Clothing & Merch',
  'Services',
  'Other',
];

export const WantedPage: React.FC<WantedPageProps> = ({
  onIHaveThis,
  onExploreMarketplace,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const currentUserId = currentUser?.uid || userProfile?.uid || userProfile?.id || '';

  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('Textbooks');
  const [budget, setBudget] = useState('');
  const [condition, setCondition] = useState('Used / Good');
  const [neededBy, setNeededBy] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('Campus Library / Main Gate');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToWantedPosts((items) => {
      setPosts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      openAuthModal('login');
      return;
    }

    if (!title.trim() || !budget || Number(budget) <= 0) {
      setFormError('Please provide a title and valid budget in ₹.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createWantedPost({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        condition,
        neededBy: neededBy.trim() || undefined,
        preferredLocation: preferredLocation.trim() || 'Campus',
        userId: currentUserId,
        userName: userProfile?.displayName || userProfile?.name || 'Campus Student',
        userAvatar: userProfile?.photoURL || userProfile?.avatarUrl,
        status: 'active',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setBudget('');
      setNeededBy('');
      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Could not post wanted request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchDesc = post.description?.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero / Header banner */}
      <div className="bg-gradient-to-r from-amber-500 via-[#E45A8D] to-[#A855F7] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Student Requests & ISO</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Can't find what you need? Post a Wanted request.
          </h1>
          <p className="text-sm sm:text-base text-white/90">
            Tell campus classmates what textbook, gadget, or hostel item you are looking for. Classmates with matching items can reach out directly!
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!currentUserId) {
                  openAuthModal('login');
                } else {
                  setIsCreateOpen(true);
                }
              }}
              className="px-5 py-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-600" />
              <span>Post a Wanted Request</span>
            </button>
            <button
              onClick={onExploreMarketplace}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs sm:text-sm backdrop-blur-sm transition-all cursor-pointer"
            >
              Browse Active Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search requested books, calculators, cycle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">
              {filteredPosts.length} student requests
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedCategory === 'All'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Requests
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs">
          Loading student requests...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-base">No Wanted Requests Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Be the first to post what you are looking for on campus!
            </p>
          </div>
          <button
            onClick={() => {
              if (!currentUserId) openAuthModal('login');
              else setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Create Wanted Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const isOwner = currentUserId === post.userId;

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                      {post.category}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-400">
                      {new Date(post.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-stone-900 leading-tight">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                        {post.description}
                      </p>
                    )}
                  </div>

                  {/* Budget & Condition */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                        Budget
                      </span>
                      <span className="text-base font-black text-stone-900">
                        ₹{post.budget.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                        Condition
                      </span>
                      <span className="font-bold text-stone-700">{post.condition}</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-[11px] text-stone-500">
                    {post.neededBy && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Needed by: <strong className="text-stone-700">{post.neededBy}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{post.preferredLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        post.userAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`
                      }
                      alt={post.userName || 'Student'}
                      className="w-6 h-6 rounded-full bg-amber-100 ring-1 ring-amber-200 shrink-0"
                    />
                    <span className="text-[11px] font-semibold text-stone-700 truncate">
                      {post.userName || 'Student'}
                    </span>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={async () => {
                        await deleteWantedPost(post.id);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete your wanted request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onIHaveThis(post)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>I Have This</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Wanted Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 leading-tight">
                    Post a Wanted Request
                  </h3>
                  <p className="text-xs text-stone-500">
                    Let campus classmates know what you are looking to buy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Item Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Mathematics by BS Grewal or Casio Calculator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ListingCategory)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Target Budget (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 400"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                    min="1"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Acceptable Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                  >
                    <option value="Any Condition">Any Condition</option>
                    <option value="Used / Good">Used / Good</option>
                    <option value="Like New">Like New</option>
                    <option value="Brand New">Brand New</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Needed By (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. This Friday or Before Exams"
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Preferred Handover Spot
                </label>
                <input
                  type="text"
                  placeholder="e.g. Campus Library or Hostel 4"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 7th edition preferred, highlighter marks okay."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl transition-all shadow-sm shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Posting...' : 'Post Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
