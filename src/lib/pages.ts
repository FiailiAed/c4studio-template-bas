export type PageStatus = 'active' | 'planned' | 'hidden';

export interface CatalogPage {
  name: string;
  route: string;
  description: string;
  category: 'Marketing' | 'Content' | 'Utility' | 'System';
  defaultStatus: PageStatus;
  colorClasses: {
    card: string;
    badge: string;
    text: string;
  };
}

export const PAGE_CATALOG: CatalogPage[] = [
  {
    name: 'Home',
    route: '/',
    description: 'Landing page — hero, value proposition, and primary CTA',
    category: 'Marketing',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-slate-50 border-slate-900', badge: 'bg-slate-900', text: 'text-slate-700' },
  },
  {
    name: 'About',
    route: '/about',
    description: 'Brand story, team, mission, and values',
    category: 'Marketing',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-blue-50 border-blue-600', badge: 'bg-blue-600', text: 'text-blue-900' },
  },
  {
    name: 'Services',
    route: '/services',
    description: 'Offerings, pricing tiers, and feature breakdowns',
    category: 'Marketing',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-violet-50 border-violet-600', badge: 'bg-violet-600', text: 'text-violet-900' },
  },
  {
    name: 'Reviews',
    route: '/reviews',
    description: 'Client testimonials, case studies, and social proof',
    category: 'Marketing',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-amber-50 border-amber-500', badge: 'bg-amber-500', text: 'text-amber-900' },
  },
  {
    name: 'Blog',
    route: '/blog',
    description: 'Content hub — articles, announcements, and updates',
    category: 'Content',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-emerald-50 border-emerald-600', badge: 'bg-emerald-600', text: 'text-emerald-900' },
  },
  {
    name: 'Gallery',
    route: '/gallery',
    description: 'Visual portfolio — images, videos, and media showcase',
    category: 'Content',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-pink-50 border-pink-500', badge: 'bg-pink-500', text: 'text-pink-900' },
  },
  {
    name: 'Contact',
    route: '/contact',
    description: 'Inquiry form, location, and direct contact details',
    category: 'Utility',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-cyan-50 border-cyan-600', badge: 'bg-cyan-600', text: 'text-cyan-900' },
  },
  {
    name: 'Admin Portal',
    route: '/admin',
    description: 'Protected dashboard — content, users, and site management',
    category: 'System',
    defaultStatus: 'planned',
    colorClasses: { card: 'bg-red-50 border-red-600', badge: 'bg-red-600', text: 'text-red-900' },
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Marketing: 'bg-blue-100 text-blue-700',
  Content:   'bg-emerald-100 text-emerald-700',
  Utility:   'bg-amber-100 text-amber-700',
  System:    'bg-red-100 text-red-700',
};
