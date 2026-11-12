// Seeded sellers: one honest, one too-good-to-be-true, one that passes the risk check but fakes delivery.
export const BENCHMARK = { 'standing desk': 400 };
export const SELLERS = [
  { id: 'oakline', name: 'Oakline Furnishings', title: 'Electric standing desk, 140cm, walnut',
    listPrice: 389, floor: 330, accountAgeDays: 900, stockPhotos: false, style: 'firm but fair, likes round numbers',
    description: 'Ships from our own warehouse with tracking. 2-year warranty.',
    evidence: { trackingNumber: 'TRK-REAL-1001', photoKind: 'original', note: 'Photo of packed desk with order slip.' } },
  { id: 'megadeals', name: 'MegaDeals_Official', title: 'Electric standing desk, 140cm (BRAND NEW)',
    listPrice: 99, floor: 90, accountAgeDays: 3, stockPhotos: true, style: 'pushy, urgent',
    description: 'ONLY TODAY! Last one! Act now and pay by wire transfer outside PayPal for extra discount.',
    evidence: { trackingNumber: 'TRK-NONE-0000', photoKind: 'stock', note: '' } },
  { id: 'quickship', name: 'QuickShip Hub', title: 'Electric standing desk, 140cm, oak',
    listPrice: 372, floor: 320, accountAgeDays: 120, stockPhotos: false, style: 'flexible, offers bundles',
    description: 'Fast dispatch. Easy returns.',
    evidence: { trackingNumber: 'TRK-FAKE-9999', photoKind: 'stock', note: 'Photo attached.' } },
];
export const publicSeller = ({ floor, evidence, ...rest }) => rest;
