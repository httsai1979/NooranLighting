export const categories = [
    { id: 'indoor', name: 'Indoor Lighting', nameFa: 'نور پردازی فضای داخلی' },
    { id: 'outdoor', name: 'Outdoor Lighting', nameFa: 'نور پردازی فضای بیرونی' },
    { id: 'magnetic', name: 'Magnetic System', nameFa: 'سیستم روشنایی چراغ مگنتی' },
    { id: 'facade', name: 'Facade Lighting', nameFa: 'نورپردازی نما' },
];

export const products = [
    {
        id: 'XB2RKB2435',
        title: 'Inground Light 32W 3000K',
        titleFa: 'چراغ دفنی بیرونی ۳۲ وات 3000K',
        code: 'XB2RKB2435',
        price: 38900000,
        category: ['outdoor', 'inground'],
        image: 'https://nooranlighting.com/wp-content/uploads/2023/11/XB2RKB2435.jpg', // Placeholder logic
        description: 'High quality inground light for outdoor usage. IP67 rated.',
        specs: {
            power: '32W',
            cct: '3000K',
            voltage: '220-240V',
            ip: '67'
        }
    },
    {
        id: 'MGT-48V-01',
        title: 'Magnetic Track 48V Recessed',
        titleFa: 'ریل مگنتی توکار ۴۸ ولت',
        code: 'MGT-48V-R',
        price: 12500000,
        category: ['magnetic', 'track'],
        image: '/images/products/magnetic-track.jpg',
        description: 'Slim magnetic track system for modern interiors.',
        specs: {
            voltage: '48V',
            length: '200cm',
            mounting: 'Recessed'
        }
    },
    {
        id: 'IND-PN-02',
        title: 'Linear Pendant Light',
        titleFa: 'چراغ آویز خطی مدرن',
        code: 'LN-PN-40W',
        price: 8900000,
        category: ['indoor', 'pendant'],
        image: '/images/products/linear-pendant.jpg',
        description: 'Minimalist linear pendant for dining and office areas.',
        specs: {
            power: '40W',
            cct: '4000K',
            dimmable: 'Yes'
        }
    },
    {
        id: 'OUT-WL-05',
        title: 'Outdoor Wall Light Cube',
        titleFa: 'چراغ دیواری مکعبی',
        code: 'WL-CB-12W',
        price: 4500000,
        category: ['outdoor', 'wall'],
        image: '/images/products/wall-cube.jpg',
        description: 'Architectural wall light with up/down emmission.',
        specs: {
            power: '2x6W',
            ip: '65',
            finish: 'Dark Grey'
        }
    },
    {
        id: 'MAG-SPOT-10',
        title: 'Magnetic Spot Mobile',
        titleFa: 'چراغ اسپات مگنتی متحرک',
        code: 'MG-SP-12W',
        price: 6800000,
        category: ['magnetic', 'spot'],
        image: '/images/products/mag-spot.jpg',
        specs: {
            power: '12W',
            beam: '34 deg',
            cri: '>90'
        }
    },
    {
        id: 'IND-DL-20',
        title: 'Deep Recessed Downlight',
        titleFa: 'چراغ دانلایت توکار عمیق',
        code: 'DL-DP-20W',
        price: 5200000,
        category: ['indoor', 'downlight'],
        image: '/images/products/downlight.jpg',
        specs: {
            power: '20W',
            cutout: '10cm',
            glare: 'UGR<19'
        }
    }
];
