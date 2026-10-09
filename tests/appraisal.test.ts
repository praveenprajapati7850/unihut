import { describe, it, expect } from 'vitest';
import { calculateFallbackAppraisal } from '../src/lib/appraisal';
import { Listing } from '../src/types';

describe('appraisal - calculateFallbackAppraisal', () => {
  it('calculates correct appraisal for good deals', () => {
    const listing = {
      id: '1',
      price: 100,
      originalPrice: 200,
      condition: 'Like New'
    } as Listing;

    const result = calculateFallbackAppraisal(listing);
    expect(result.rating).toBe('Good Deal');
    expect(result.badgeColor).toBe('emerald');
  });

  it('calculates correct appraisal for fair deals', () => {
    const listing = {
      id: '2',
      price: 150,
      originalPrice: 160,
      condition: 'Like New'
    } as Listing;

    const result = calculateFallbackAppraisal(listing);
    expect(result.rating).toBe('Fair Deal');
    expect(result.badgeColor).toBe('amber');
  });
});
