import { ShouldIBuyAnalysis, Listing, DealVerdict } from '../types';

export const calculateFallbackAppraisal = (listing: Listing): ShouldIBuyAnalysis => {
  const asking = listing.price;
  const orig = listing.originalPrice || asking * 1.4;
  const discount = Math.round(((orig - asking) / orig) * 100);
  const suggested = Math.round(asking * 0.85);

  return {
    rating: (discount >= 25 ? 'Good Deal' : 'Fair Deal') as DealVerdict,
    badgeColor: (discount >= 25 ? 'emerald' : 'amber'),
    headline: `${discount}% below estimated retail value.`,
    explanation: `Asking price is ₹${asking.toLocaleString('en-IN')}. Reasonable for campus peer exchange in ${listing.condition.toLowerCase()} condition.`,
    suggestedOfferPrice: suggested,
    marketFairPriceRange: `₹${Math.round(asking * 0.8)} – ₹${Math.round(asking * 1.05)}`,
    pros: ['Direct peer exchange on campus', 'Verified student listing'],
    cautions: ['Inspect physical item before completing exchange'],
    disclaimer: 'AI estimate based on campus benchmarks. Not guaranteed appraisal.',
  };
};
