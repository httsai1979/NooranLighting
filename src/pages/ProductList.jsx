import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { products, categories } from '../data/products';
import { Search, Filter, ShoppingCart, ChevronDown, ChevronRight } from 'lucide-react';

export default function ProductList() {
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'indoor', 'magnetic', etc.
    const [expandedCategory, setExpandedCategory] = useState(null); // For accordion menu
    const [search, setSearch] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            let matchCat = true;
            if (activeFilter !== 'all') {
                // Check if activeFilter matches main category OR subcategory
                matchCat = p.category === activeFilter || p.subcategory === activeFilter;
            }

            const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.code.toLowerCase().includes(search.toLowerCase());

            return matchCat && matchSearch;
        });
    }, [activeFilter, search]);

    const toggleCategory = (catId) => {
        if (expandedCategory === catId) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(catId);
        }
    };

    return (
        <div className="pt-20 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Products</h1>
                    <p className="text-gray-500 text-sm md:text-base">Browse our complete collection of lighting solutions.</p>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <button
                        className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-full bg-white text-sm font-medium"
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    >
                        <Filter size={16} /> Filters
                    </button>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search code or name..."
                            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters - Desktop & Mobile Drawer */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:bg-transparent lg:w-64 lg:block shrink-0
                    ${mobileFiltersOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}>
                    <div className="h-full overflow-y-auto p-6 lg:p-0 lg:sticky lg:top-24">
                        <div className="flex justify-between items-center lg:hidden mb-6">
                            <h3 className="font-bold text-lg">Filters</h3>
                            <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-500">Close</button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <h3 className="font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-gray-400">Categories</h3>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => { setActiveFilter('all'); setMobileFiltersOpen(false); }}
                                        className={`text-left w-full px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'all' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
                                    >
                                        All Products
                                    </button>
                                </li>
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <div className="flex items-center justify-between group">
                                            <button
                                                onClick={() => { setActiveFilter(cat.id); setMobileFiltersOpen(false); }}
                                                className={`text-left flex-1 px-3 py-2 rounded-lg text-sm transition-colors font-medium ${activeFilter === cat.id ? 'text-gold-600' : 'text-gray-900 group-hover:text-gold-600'}`}
                                            >
                                                {cat.name}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id); }}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                {expandedCategory === cat.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </button>
                                        </div>

                                        {/* Subcategories */}
                                        {(expandedCategory === cat.id || activeFilter === cat.id || categories.find(c => c.id === cat.id).subcategories.some(sub => sub.id === activeFilter)) && (
                                            <ul className="ml-4 border-l-2 border-gray-200 pl-2 mt-1 space-y-1">
                                                {cat.subcategories.map(sub => (
                                                    <li key={sub.id}>
                                                        <button
                                                            onClick={() => { setActiveFilter(sub.id); setMobileFiltersOpen(false); }}
                                                            className={`text-left w-full px-3 py-1.5 rounded-lg text-sm transition-colors ${activeFilter === sub.id ? 'text-black font-bold bg-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile filter */}
                {mobileFiltersOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setMobileFiltersOpen(false)}
                    />
                )}

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
                        {filteredProducts.map(p => (
                            <Link to={`/product/${p.id}`} key={p.id} className="bg-white border md:border-transparent md:hover:border-gold-400 md:shadow-sm rounded-xl overflow-hidden transition-all group flex flex-col h-full">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                        {/* Placeholder Handling with Error Fallback (concept) */}
                                        <img
                                            src={p.assets?.mainImage || p.image}
                                            alt={p.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x400/f5f5f5/a0a0a0?text=Nooran'; }}
                                        />
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-white p-2 rounded-full shadow-md hover:bg-gold-500 hover:text-white transition-colors">
                                            <ShoppingCart size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 flex flex-col flex-1">
                                    <div className="mb-1">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{p.subcategory}</span>
                                    </div>
                                    <h3 className="font-bold text-sm md:text-lg leading-tight mb-1 text-gray-900 line-clamp-2">{p.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">{p.code}</p>

                                    <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
                                        {p.price ? (
                                            <span className="text-gold-600 font-bold text-sm md:text-base">{p.price.toLocaleString()} T</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Contact for Quote</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">No products found in this category.</p>
                            <button onClick={() => setActiveFilter('all')} className="mt-4 text-gold-600 font-bold hover:underline">View All Products</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

