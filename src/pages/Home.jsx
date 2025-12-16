import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { products } from '../data/products';

export default function Home() {
    const featured = products.slice(0, 3);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[80vh] bg-slate-900 text-white flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://nooranlighting.com/wp-content/uploads/2023/11/slider-1.jpg')] bg-cover bg-center opacity-40"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Illuminating Excellence</h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
                        Premium architectural lighting solutions for modern spaces.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/shop" className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2">
                            Browse Products <ArrowRight size={20} />
                        </Link>
                        <Link to="/simulator" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full font-medium transition-all">
                            Try 3D Simulator
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full">
                <h2 className="text-3xl font-bold mb-12 text-center">Our Collections</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['Indoor', 'Outdoor', 'Magnetic'].map((cat) => (
                        <div key={cat} className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                            <div className="absolute inset-0 bg-slate-800 transition-transform group-hover:scale-110"></div>
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="relative h-full flex items-center justify-center">
                                <h3 className="text-3xl font-bold text-white tracking-widest uppercase">{cat}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sales / Featured Products */}
            <section className="py-20 bg-slate-50 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 flex items-center gap-2">
                        <Star className="text-gold-500 fill-current" /> Featured Products
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featured.map((p) => (
                            <Link to={`/product/${p.id}`} key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    {/* Placeholder for real image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
                                        {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : 'No Image'}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1">{p.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{p.code}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gold-600 font-bold">{p.price.toLocaleString()} T</span>
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">{p.category[1]}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
