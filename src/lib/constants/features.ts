/**
 * Feature keys for modular SaaS toggling.
 * These can be enabled/disabled per client setup.
 */
export enum FeatureKey {
    SCHEDULING = 'scheduling',
    PAYROLL = 'payroll',
    NOTIFICATIONS = 'notifications',
    POS_PROMOTIONS = 'pos_promotions',
    MULTI_LOCATION = 'multi_location',
    CLIENT_AUTH = 'client_auth',
    ANALYTICS_ADVANCED = 'analytics_advanced',
    TAX_REPORTING = 'tax_reporting',
    INVENTORY = 'inventory',
    SPARTAN_PAYMENTS = 'spartan_payments',
    FINANCING = 'financing',
    MARKETPLACE = 'marketplace',
    TRAINER_SERVICES = 'trainer_services',
    REGIONAL_INSIGHTS = 'regional_insights',
    CORPORATE_WELLNESS = 'corporate_wellness',
    ACADEMY = 'academy',
}

export interface FeatureConfig {
    id: FeatureKey;
    label: string;
    description: string;
    enabled: boolean;
    tier: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'ECOSYSTEM';
}

/**
 * Default feature configuration.
 * This can be overridden by a remote config or local DB settings.
 */
export const DEFAULT_FEATURES: Record<FeatureKey, FeatureConfig> = {
    [FeatureKey.SCHEDULING]: {
        id: FeatureKey.SCHEDULING,
        label: 'Scheduling & Classes',
        description: 'Manage class schedules, bookings, and waitlists.',
        enabled: false,
        tier: 'PRO'
    },
    [FeatureKey.PAYROLL]: {
        id: FeatureKey.PAYROLL,
        label: 'Staff Payroll & Shifts',
        description: 'Track staff hours and calculate commissions.',
        enabled: false,
        tier: 'ENTERPRISE'
    },
    [FeatureKey.NOTIFICATIONS]: {
        id: FeatureKey.NOTIFICATIONS,
        label: 'Automated Communications',
        description: 'Send automated WhatsApp and Email messages.',
        enabled: true,
        tier: 'PRO'
    },
    [FeatureKey.POS_PROMOTIONS]: {
        id: FeatureKey.POS_PROMOTIONS,
        label: 'Promotions & Bundles',
        description: 'Manage POS discounts and product bundles.',
        enabled: true,
        tier: 'PRO'
    },
    [FeatureKey.MULTI_LOCATION]: {
        id: FeatureKey.MULTI_LOCATION,
        label: 'Multi-Location Support',
        description: 'Scale across multiple gym locations.',
        enabled: false,
        tier: 'ENTERPRISE'
    },
    [FeatureKey.CLIENT_AUTH]: {
        id: FeatureKey.CLIENT_AUTH,
        label: 'Member Portal',
        description: 'Allow members to log in and track progress.',
        enabled: true,
        tier: 'BASIC'
    },
    [FeatureKey.ANALYTICS_ADVANCED]: {
        id: FeatureKey.ANALYTICS_ADVANCED,
        label: 'Advanced Analytics',
        description: 'Business intelligence and retention metrics.',
        enabled: true,
        tier: 'PRO'
    },
    [FeatureKey.TAX_REPORTING]: {
        id: FeatureKey.TAX_REPORTING,
        label: 'Tax Compliance (SAR)',
        description: 'Localized tax reporting for Honduras.',
        enabled: true,
        tier: 'BASIC'
    },
    [FeatureKey.INVENTORY]: {
        id: FeatureKey.INVENTORY,
        label: 'Inventory Management',
        description: 'Track products, stock levels, and suppliers.',
        enabled: true,
        tier: 'BASIC'
    },
    [FeatureKey.SPARTAN_PAYMENTS]: {
        id: FeatureKey.SPARTAN_PAYMENTS,
        label: 'Spartan Payments',
        description: 'Integrated card-on-file, recurring billing, and dunning.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.FINANCING]: {
        id: FeatureKey.FINANCING,
        label: 'Membership Financing',
        description: 'Offer installment plans and split payments to members.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.MARKETPLACE]: {
        id: FeatureKey.MARKETPLACE,
        label: 'Gym Marketplace',
        description: 'B2B directory for equipment, supplements, and services.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.TRAINER_SERVICES]: {
        id: FeatureKey.TRAINER_SERVICES,
        label: 'Trainer Multi-Store',
        description: 'Sell personal training, programs, and coaching.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.REGIONAL_INSIGHTS]: {
        id: FeatureKey.REGIONAL_INSIGHTS,
        label: 'Regional Benchmarks',
        description: 'Anonymized local business intelligence and trends.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.CORPORATE_WELLNESS]: {
        id: FeatureKey.CORPORATE_WELLNESS,
        label: 'Corporate Wellness',
        description: 'B2B sponsorship tools and employer dashboards.',
        enabled: false,
        tier: 'ECOSYSTEM'
    },
    [FeatureKey.ACADEMY]: {
        id: FeatureKey.ACADEMY,
        label: 'Spartan Academy',
        description: 'Education portal for gym owners and staff.',
        enabled: false,
        tier: 'ECOSYSTEM'
    }
};
