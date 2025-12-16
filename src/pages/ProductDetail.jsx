import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import { ChevronRight, ShoppingBag, Download, Box } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const product = products.find(p => p.id === id);
    const [qty, setQty] = useState(1);

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;
    }

    return (
        <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen pb-20">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link to="/" className="hover:text-gold-600">Home</Link>
                <ChevronRight size={14} />
                <Link to="/shop" className="hover:text-gold-600">Shop</Link>
                <ChevronRight size={14} />
                <span className="text-black font-medium">{product.title}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border">
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                            {product.image ? <img src={product.image} alt={product.title} className="w-full h-full object-cover" /> : 'No Image'}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-50 rounded-lg border hover:border-gold-500 cursor-pointer"></div>
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                    <h2 className="text-xl text-gray-400 mb-6 font-light">{product.titleFa}</h2>

                    <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 rounded-xl">
                        <span className="text-sm font-bold text-slate-500">PRICE</span>
                        <span className="text-3xl font-bold text-gold-600">{product.price.toLocaleString()} <span className="text-sm text-black">Toman</span></span>
                    </div>

                    <div className="prose text-gray-600 mb-8">
                        <p>{product.description}</p>
                    </div>

                    {/* Specs */}
                    <div className="mb-8">
                        <h3 className="font-bold border-b pb-2 mb-4">Technical Specifications</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {product.specs && Object.entries(product.specs).map(([key, val]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="capitalize text-gray-500">{key}:</span>
                                    <span className="font-medium">{val}</span>
                                </div>
                            ))}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Product Code:</span>
                                <span className="font-medium">{product.code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Add to Cart Actions */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center border border-gray-300 rounded-full">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-100 rounded-l-full">-</button>
                            <input type="number" value={qty} readOnly className="w-12 text-center focus:outline-none" />
                            <button onClick={() => setQty(qty + 1)} className="px-4 py-2 hover:bg-gray-100 rounded-r-full">+</button>
                        </div>
                        <button className="flex-1 bg-black text-white py-3 rounded-full font-bold hover:bg-gold-500 hover:text-black transition-colors flex items-center justify-center gap-2">
                            <ShoppingBag size={20} /> Add to Order
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex-1 border border-gray-300 py-3 rounded-xl hover:border-black flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Download size={16} /> Datasheet
                        </button>
                        <button className="flex-1 border border-gray-300 py-3 rounded-xl hover:border-black flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Box size={16} /> 3D Model
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
