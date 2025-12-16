export const categories = [
    {
        id: 'indoor',
        name: 'Indoor Lighting',
        nameFa: 'روشنایی داخلی',
        subcategories: [
            { id: 'magnetic', name: 'Magnetic System', nameFa: 'سیستم مگنتی' },
            { id: 'downlight', name: 'Downlights', nameFa: 'چراغ دانلایت' },
            { id: 'linear', name: 'Linear Lights', nameFa: 'چراغ خطی' },
            { id: 'track', name: 'Track Lights', nameFa: 'چراغ ریلی' },
            { id: 'pendant', name: 'Pendant Lights', nameFa: 'چراغ آویز' },
            { id: 'wall', name: 'Wall Lights', nameFa: 'چراغ دیواری' },
            { id: 'spot', name: 'Spotlights', nameFa: 'چراغ اسپات' }
        ]
    },
    {
        id: 'outdoor',
        name: 'Outdoor Lighting',
        nameFa: 'روشنایی خارجی',
        subcategories: [
            { id: 'facade', name: 'Facade Lighting', nameFa: 'نورپردازی نما' },
            { id: 'inground', name: 'Inground Lights', nameFa: 'چراغ دفنی' },
            { id: 'bollard', name: 'Bollard Lights', nameFa: 'چراغ پارکی/بولارد' },
            { id: 'poll', name: 'Pole Lights', nameFa: 'چراغ پایه دار' },
            { id: 'step', name: 'Step Lights', nameFa: 'چراغ پله' },
            { id: 'underwater', name: 'Underwater', nameFa: 'چراغ استخری' }
        ]
    }
];

// Helper to generate SEO data
const generateSEO = (product) => ({
    title: `${product.title} | ${product.code} | Nooran Lighting`,
    description: `Buy ${product.title} (${product.code}). High quality ${product.category} lighting. Specs: ${product.specs.power || 'N/A'}, ${product.specs.cct || ''}.`,
    keywords: `${product.title}, ${product.code}, Nooran Lighting, ${product.category}, ${product.subcategory}, lighting fixture`
});

const rawProducts = [
    // --- INDOOR: Magnetic ---
    {
        id: 'MAG-rec-48V',
        code: 'MGT-REC-48V-2M',
        title: 'Magnetic Track Recessed 48V',
        titleFa: 'ریل مگنتی توکار ۴۸ ولت',
        category: 'indoor',
        subcategory: 'magnetic',
        price: 12500000,
        image: 'MGT-REC-48V-2M.jpg',
        description: 'High-end recessed magnetic track system compatible with 48V magnetic modules. Seamless integration into drywall ceilings.',
        specs: {
            brand: 'Nooran',
            voltage: '48V DC',
            length: '2000mm',
            width: '45mm',
            material: 'Aluminum Extrusion',
            color: 'Black / White',
            mounting: 'Recessed'
        }
    },
    {
        id: 'MAG-spot-12w',
        code: 'MG-SP-12W',
        title: 'Magnetic Module Spot 12W',
        titleFa: 'ماژول مگنتی اسپات ۱۲ وات',
        category: 'indoor',
        subcategory: 'magnetic',
        price: 4800000,
        image: 'MG-SP-12W.jpg',
        description: 'Adjustable LED spot module for 48V magnetic track system. High CRI for vivid colors.',
        specs: {
            power: '12W',
            cct: '3000K / 4000K',
            lumen: '1080lm',
            beamAngle: '36°',
            cri: '>90',
            dimmable: 'Optional (DALI/0-10V)'
        }
    },
    {
        id: 'MAG-linear-12w',
        code: 'MG-LN-12W',
        title: 'Magnetic Linear Flood 12W',
        titleFa: 'ماژول مگنتی خطی ۱۲ وات',
        category: 'indoor',
        subcategory: 'magnetic',
        price: 4200000,
        image: 'MG-LN-12W.jpg',
        description: 'Diffuse linear light module for general lighting in magnetic tracks.',
        specs: {
            power: '12W',
            cct: '3000K / 4000K',
            lumen: '960lm',
            length: '300mm',
            cri: '>90'
        }
    },

    // --- INDOOR: Pendant ---
    {
        id: 'IND-PN-Ring',
        code: 'PN-RNG-60W',
        title: 'Modern Ring Pendant 60W',
        titleFa: 'لوستر مدرن حلقه‌ای ۶۰ وات',
        category: 'indoor',
        subcategory: 'pendant',
        price: 18500000,
        image: 'PN-RNG-60W.jpg',
        description: 'Statement circular profile pendant light, ideal for living rooms and lobbies.',
        specs: {
            power: '60W',
            diameter: '800mm',
            cct: '3000K',
            finish: 'Brushed Gold',
            material: 'Aluminum + PMMA',
            suspension: 'Adjustable 1.5m'
        }
    },

    // --- OUTDOOR: Facade ---
    {
        id: 'OUT-FC-Linear',
        code: 'FC-LN-24W',
        title: 'Linear Wall Grazer 24W',
        titleFa: 'وال واشر خطی نما ۲۴ وات',
        category: 'outdoor',
        subcategory: 'facade',
        price: 8900000,
        image: 'FC-LN-24W.jpg',
        description: 'Powerful linear wall washer for architectural facade lighting. IP66 waterproof.',
        specs: {
            power: '24W',
            voltage: '220V',
            cct: '3000K / RGBW',
            ipRating: 'IP66',
            lens: '15x45° Elliptical',
            length: '1000mm'
        }
    },

    // --- OUTDOOR: Bollard ---
    {
        id: 'OUT-BL-Post',
        code: 'BL-PST-10W',
        title: 'Modern Bollard Light 10W',
        titleFa: 'چراغ پارکی پایه کوتاه ۱۰ وات',
        category: 'outdoor',
        subcategory: 'bollard',
        price: 5600000,
        image: 'BL-PST-10W.jpg',
        description: 'Sleek dark grey bollard for pathway and garden illumination.',
        specs: {
            power: '10W',
            height: '600mm',
            cct: '3000K',
            ipRating: 'IP65',
            impact: 'IK08',
            material: 'Die-cast Aluminum'
        }
    },
    {
        id: 'OUT-IG-09W',
        code: 'IG-RD-09W',
        title: 'Recessed Inground Uplight 9W',
        titleFa: 'چراغ توکار دفنی ۹ وات',
        category: 'outdoor',
        subcategory: 'inground',
        price: 6200000,
        image: 'IG-RD-09W.jpg',
        description: 'Heavy duty inground light for highlighting architectural columns and trees.',
        specs: {
            power: '9W',
            beamAngle: '24°',
            cct: '3000K',
            ipRating: 'IP67',
            loadCapacity: '2000kg',
            bezel: 'Stainless Steel 316'
        }
    }
];

export const products = rawProducts.map(p => ({
    ...p,
    seo: generateSEO(p),
    // Construct asset paths automatically based on convention
    assets: {
        mainImage: `/assets/images/products/${p.code}.jpg`,
        datasheet: `/assets/datasheets/${p.code}.pdf`,
        video: `/assets/videos/${p.code}.mp4`
    }
}));
