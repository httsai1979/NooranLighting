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
- **Interactions**: Smooth## 24-Hour Launch Plan (Urgent) / 24小時上線計畫

### Target / 目標
- **Launch Time**: Within 24 hours. / 24小時內上線
- **Primary Interface**: Mobile-First (PWA ready). / 手機優先
- **Content**: Full product catalog, 100% spec accuracy, SEO optimized. / 完整產品錄，規格準確，SEO優化
- **Features**: Product Browsing, Filtering, Search, Detailed Specs, Contact/Inquiry.

### Immediate Tasks / 立即任務
1.  **Asset Structure Setup** [Done]: Create folders for Images, Videos, Datasheets, Logos.
2.  **Data Population**:
    - Build comprehensive `products.js` reflecting `nooranlighting.com` categories (Indoor/Outdoor hierarchies).
    - Implement rigorous metadata (SEO titles, descriptions) for every product.
3.  **Mobile UI Optimization**:
    - Enhance `ProductList` for mobile touch (sticky filters or drawer).
    - Enhance `ProductDetail` for mobile readability and media display.
4.  **SEO Integration**:
    - Add `react-helmet-async`.
    - Inject dynamic meta tags based on product data.
5.  **User Content Guide**:
    - Provide clear instructions on mapping file names to product codes.

### Asset Locations / 檔案位置
- **Images**: `public/assets/images/products/` (Format: `[ProductCode].jpg`)
- **Videos**: `public/assets/videos/`
- **Datasheets**: `public/assets/datasheets/`
- **Logos**: `public/assets/logos/`

---
## Previous Plan (Reference)
t**:
    - Build Home.
    - Build Shop (PLP).
    - Build Product Detail (PDP).
    - Build Cart.
6.  **Optimization**: SEO tags, Mobile responsiveness, PWA Manifest.

## 6. Next Steps
- Explain to the user the limitation of "all products": As AI, I cannot scrape thousands of products instantly. I will create the *system* with representative data, which can then be populated.
- Start coding the application.
