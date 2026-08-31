export type PlanTier = 'starter' | 'pro' | 'studio';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  originalPrice: number;
  priceDisplay: string;
  billingPeriod: string;
  description: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

/**
 * Global Configuration for Free Access Mode
 * When true, all plans (Creator Pro and Production Studio) are completely free,
 * active, and fully accessible without payment, subscription, or plan restrictions.
 */
export const FREE_ACCESS_MODE = true;

export const PLANS: Record<PlanTier, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Creator',
    originalPrice: 0,
    priceDisplay: '$0',
    billingPeriod: '/ forever',
    description: 'Perfect for exploring and creating your first complete video packages.',
    features: [
      '3 Full Video Packages / mo',
      'Retention Hook Engine',
      'Basic Scene Prompts',
    ],
    ctaText: 'Get Started Free',
  },
  pro: {
    id: 'pro',
    name: 'Creator Pro',
    originalPrice: 29,
    priceDisplay: '$29',
    billingPeriod: '/ month',
    description: 'For active YouTubers publishing weekly high-retention content.',
    features: [
      'Unlimited Video Packages',
      'Runway, Luma & Veo Prompts',
      'High-CTR Thumbnail Studio',
      'Full 9:16 Shorts Suite',
    ],
    ctaText: FREE_ACCESS_MODE ? 'Start Creator Pro — FREE' : 'Start Creator Pro',
    popular: true,
  },
  studio: {
    id: 'studio',
    name: 'Production Studio',
    originalPrice: 99,
    priceDisplay: '$99',
    billingPeriod: '/ month',
    description: 'For multi-channel media networks and full video production teams.',
    features: [
      'Multi-seat Team Collaboration',
      'Character Consistency Library',
      'CSV & Batch Export Pipelines',
    ],
    ctaText: FREE_ACCESS_MODE ? 'Unlock Production Studio — FREE' : 'Unlock Production Studio',
  },
};

/**
 * Access Control Entitlement Check
 * Validates if the user is entitled to a specific feature or plan level.
 */
export function hasPlanAccess(requiredTier: PlanTier, userTier: PlanTier = 'starter'): boolean {
  if (FREE_ACCESS_MODE) {
    return true; // Creator Pro & Production Studio entitlements are fully active
  }

  const tierRank: Record<PlanTier, number> = {
    starter: 1,
    pro: 2,
    studio: 3,
  };

  return tierRank[userTier] >= tierRank[requiredTier];
}
