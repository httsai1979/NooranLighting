import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import { ChevronLeft, ShoppingCart, Download, Play, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ProductDetail() {
    const { id } = useParams();
    const product = products.find(p => p.id === id);
    const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'downloads'

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center pt-24 text-center px-4">
                <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
                <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
                <Link to="/shop" className="bg-black text-white px-6 py-3 rounded-full hover:bg-gold-500 hover:text-black transition-colors">
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{product.seo.title}</title>
                <meta name="description" content={product.seo.description} />
                <meta name="keywords" content={product.seo.keywords} />
                <link rel="canonical" href={`https://nooranlighting.com/product/${product.id}`} />
            </Helmet>

            <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
                <Link to="/shop" className="inline-flex items-center text-gray-500 hover:text-black mb-6 md:mb-8 transition-colors">
                    <ChevronLeft size={20} /> Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm">
                            <img
                                src={product.assets?.mainImage || product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x800/f5f5f5/a0a0a0?text=Nooran'; }}
                            />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div>
                        <div className="mb-2 text-gold-600 font-bold tracking-wider text-sm uppercase">
                            {product.subcategory || product.category} Series
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-gray-900 leading-tight">
                            {product.title}
                        </h1>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-gray-500 text-lg">{product.code}</span>
                            {product.price && <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">In Stock</span>}
                        </div>

                        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                            {product.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-10 border-b border-gray-100 pb-10">
                            {product.price ? (
                                <div className="text-3xl font-bold text-gray-900">
                                    {product.price.toLocaleString()} <span className="text-base font-normal text-gray-500">Toman</span>
                                </div>
                            ) : (
                                <div className="text-2xl font-medium text-gray-400">Price on Request</div>
                            )}

                            <div className="flex-1 sm:ml-auto flex gap-3">
                                <button className="flex-1 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gold-500 hover:text-black transition-all flex items-center justify-center gap-2">
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                </button>
                                <button className="p-4 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-gray-600">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs / Specs */}
                        <div>
                            <div className="flex gap-8 border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => setActiveTab('specs')}
                                    className={`pb-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'specs' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Specifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('downloads')}
                                    className={`pb-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'downloads' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Downloads & Media
                                </button>
                            </div>

                            {activeTab === 'specs' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                    {Object.entries(product.specs || {}).map(([key, value]) => (
                                        <div key={key} className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-gray-400 text-xs uppercase font-semibold mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="text-gray-900 font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-gold-400 transition-colors group cursor-pointer bg-gray-50 hover:bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                                                <Download size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">Technical Datasheet</div>
                                                <div className="text-xs text-gray-500">PDF - 2.4 MB</div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gold-600">Download</span>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-gold-400 transition-colors group cursor-pointer bg-gray-50 hover:bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 shadow-sm">
                                                <Play size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">Installation Video</div>
                                                <div className="text-xs text-gray-500">MP4 - 1080p</div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-blue-600">Watch</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
