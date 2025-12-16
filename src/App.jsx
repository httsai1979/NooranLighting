import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';

// Lazy load the Heavy Simulator
const LightingSimulator = lazy(() => import('./components/demo/LightingSimulator'));

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md text-white border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-gold-500 flex items-center justify-center">
                        <span className="text-gold-500 text-xs font-bold">N</span>
                    </div>
                    NOORAN
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link to="/" className="hover:text-gold-500 transition-colors">HOME</Link>
                    <Link to="/shop" className="hover:text-gold-500 transition-colors">PRODUCTS</Link>
                    <Link to="/simulator" className="hover:text-gold-500 transition-colors text-gold-500">3D SIMULATOR</Link>
                    <Link to="/about" className="hover:text-gold-500 transition-colors">ABOUT</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="hover:text-gold-500"><SearchIcon /></button>
                    <button className="hover:text-gold-500"><User size={20} /></button>
                    <Link to="/cart" className="relative hover:text-gold-500">
                        <ShoppingBag size={20} />
                        <span className="absolute -top-1 -right-1 bg-gold-500 text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span>
                    </Link>
                    <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-black border-t border-white/10 p-6 flex flex-col gap-4">
                    <Link to="/" onClick={() => setIsOpen(false)}>HOME</Link>
                    <Link to="/shop" onClick={() => setIsOpen(false)}>PRODUCTS</Link>
                    <Link to="/simulator" onClick={() => setIsOpen(false)}>3D SIMULATOR</Link>
                </div>
            )}
        </nav>
    );
};

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
);

const Footer = () => (
    <footer className="bg-black text-white pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
                <h3 className="font-bold text-xl mb-4">NOORAN</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Premium architectural lighting solutions designed for modern living spaces.
                </p>
            </div>
            <div>
                <h4 className="font-bold mb-4">Products</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                    <li><Link to="/shop">Indoor Lighting</Link></li>
                    <li><Link to="/shop">Outdoor Lighting</Link></li>
                    <li><Link to="/shop">Magnetic Systems</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                    <li>Downloads</li>
                    <li>Contact Us</li>
                    <li>Projects</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-4">Contact</h4>
                <p className="text-gray-400 text-sm">Info@nooranlighting.com</p>
                <p className="text-gray-400 text-sm">+98 21 1234 5678</p>
            </div>
        </div>
        <div className="text-center text-gray-600 text-xs border-t border-white/10 pt-8">
            © 2024 NOORAN LIGHTING. All rights reserved.
        </div>
    </footer>
);

export default function App() {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<ProductList />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route
                            path="/simulator"
                            element={
                                <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading Engine...</div>}>
                                    <LightingSimulator />
                                </Suspense>
                            }
                        />
                    </Routes>
                </main>
                <Routes>
                    {/* Only show Footer on non-simulator pages. The simulator takes full height. */}
                    <Route path="/simulator" element={<></>} />
                    <Route path="*" element={<Footer />} />
                </Routes>
            </div>
        </Router>
    );
}