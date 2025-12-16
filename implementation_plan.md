# Nooran Lighting Web App - Implementation Plan

## 1. Project Overview
**Goal**: Create a premium web-based application (PWA) for browsing and ordering lighting products from [Nooran Lighting](https://nooranlighting.com/).
**Target Audience**: Mobile users (Architects, Designers, Customers).
**Key Features**:
- Full Product Catalog (Indoor, Outdoor, Magnetic).
- Advanced Search & Filtering.
- Product Details (Images, Specs, Downloads).
- Shopping Cart & Inquiry/Checkout System.
- Premium UI/UX (Animations, High-end aesthetics).

## 2. Technology Stack
- **Framework**: Next.js 14+ (App Router) - For SEO, Performance, and PWA support.
- **Language**: TypeScript - For type safety.
- **Styling**: Tailwind CSS - For rapid, custom design.
- **UI Library**: Framer Motion (Animations), Lucide React (Icons), Shadcn/UI (Base components).
- **State Management**: Zustand (Cart management).
- **Data Source**: 
    - *Phase 1 (Prototype)*: Static JSON file (`products.json`) mimicking the real site structure.
    - *Phase 2 (Production)*: Connect to a CMS or Database (future step).

## 3. Architecture & Data Structure
### Product Entity
```typescript
interface Product {
  id: string;
  code: string; // e.g., XB2RKB2435
  title: string;
  category: string[]; // e.g., ["Outdoor", "Inground"]
  price: number;
  description: string;
  images: string[];
  specs: Record<string, string>; // { "Voltage": "220V", "IP": "67" }
  downloads: {
    datasheet?: string;
    model3d?: string;
  };
}
```

### Routing
- `/`: Home (Hero, Categories, Featured).
- `/shop`: Product Listing Page (Filters, Grid).
- `/product/[id]`: Product Detail Page.
- `/cart`: Shopping Cart.
- `/checkout`: Inquiry/Order form.

## 4. Design System (Premium Aesthetic)
- **Palette**:
    - Primary: Dark Slate (`#1a1a1a`) - Luxury feel.
    - Accent: Gold (`#D4AF37`) - Highlighting premium status.
    - Background: Clean White (`#ffffff`) for readability, Light Grey (`#f5f5f5`) for sections.
- **Typography**: Clean Sans-Serif (e.g., Inter or Vazirmatn for Persian support).
- **Interactions**: Smooth page transitions, hover effects on product cards.

## 5. Implementation Steps
1.  **Setup**: Initialize Next.js project, install dependencies.
2.  **Foundation**: Configure Tailwind, Fonts, and Layout (Navbar, Footer).
3.  **Data Layer**: Create `products.ts` with sample real data.
4.  **Components**:
    - `ProductCard`: Elegant display of product info.
    - `FilterSidebar`: For narrowing down selection.
    - `HeroSection`: Impactful visual introduction.
5.  **Pages Development**:
    - Build Home.
    - Build Shop (PLP).
    - Build Product Detail (PDP).
    - Build Cart.
6.  **Optimization**: SEO tags, Mobile responsiveness, PWA Manifest.

## 6. Next Steps
- Explain to the user the limitation of "all products": As AI, I cannot scrape thousands of products instantly. I will create the *system* with representative data, which can then be populated.
- Start coding the application.
