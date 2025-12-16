import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { products, categories } from '../data/products';
import { Search, Filter, ShoppingCart } from 'lucide-react';

export default function ProductList() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchCat = activeCategory === 'all' || p.category.includes(activeCategory);
            const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.code.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [activeCategory, search]);

    return (
        <div className="pt-20 px-6 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Shop All Products</h1>
                    <p className="text-gray-500">Explore our premium collection of lighting fixtures.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gold-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-2xl">
                            <h3 className="font-bold flex items-center gap-2 mb-4"><Filter size={18} /> Categories</h3>
                            <ul className="space-y-2">
                                <li>
                                    <button
                                        onClick={() => setActiveCategory('all')}
                                        className={`text-left w-full px-3 py-2 rounded-lg transition-colors ${activeCategory === 'all' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
                                    >
                                        All Products
                                    </button>
                                </li>
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`text-left w-full px-3 py-2 rounded-lg transition-colors ${activeCategory === cat.id ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(p => (
                            <Link to={`/product/${p.id}`} key={p.id} className="bg-white border hover:border-gold-400 rounded-xl overflow-hidden transition-all group flex flex-col">
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                        {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : 'No Image'}
                                    </div>
                                    {/* Quick Add Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm">View Details</span>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg leading-tight">{p.title}</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">{p.code}</p>

                                    <div className="mt-auto flex justify-between items-center border-t pt-4">
                                        <span className="text-gold-600 font-bold text-lg">{p.price.toLocaleString()} T</span>
                                        <button className="bg-slate-900 text-white p-2 rounded-full hover:bg-gold-500 hover:text-black transition-colors">
                                            <ShoppingCart size={18} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
