/*
 * Model line-up shown on the site.
 *
 * Prices are indicative US starting MSRPs for the 2026 model year, excluding
 * destination & handling. They change often — always confirm with BMW USA or
 * an authorised BMW centre before quoting them.
 *
 * `look` drives the generated side-view illustration (see SuvSilhouette.jsx).
 */

export const PRICE_NOTE =
  'Indicative US starting MSRP for model year 2026, excluding destination, taxes, title and options. Prices and specifications are subject to change.'

export const M4 = {
  id: 'm4-competition',
  name: 'M4 Competition',
  series: 'M Performance Coupe',
  categories: ['m'],
  tagline: 'Track-bred. Street-legal. Unapologetically loud.',
  description:
    'The M4 Competition is the purest expression of BMW M on the road: a 3.0-litre M TwinPower Turbo inline-six, a carbon-fibre roof that lowers the centre of gravity and a chassis tuned on the Nürburgring. Choose rear-wheel drive for the classic M experience or M xDrive for all-weather traction with a switchable 2WD mode.',
  startingPrice: 85500,
  look: { paint: '#cfd01a', paintName: 'São Paulo Yellow' },
  stats: [
    { value: '503', unit: 'hp', label: 'Max. power (RWD)' },
    { value: '479', unit: 'lb-ft', label: 'Torque' },
    { value: '3.4', unit: 's', label: '0–60 mph (xDrive)' },
    { value: '180', unit: 'mph', label: 'Top speed*' },
  ],
  trims: [
    { name: 'M4 Competition Coupe', drive: 'RWD', power: '503 hp', accel: '3.8 s', price: 85500 },
    { name: 'M4 Competition xDrive Coupe', drive: 'AWD', power: '523 hp', accel: '3.4 s', price: 89600 },
  ],
  specs: [
    ['Engine', '3.0L M TwinPower Turbo inline-6 (S58)'],
    ['Transmission', '8-speed M Steptronic with Drivelogic'],
    ['Top speed', '155 mph · 180 mph with M Driver’s Package*'],
    ['Seats', '4'],
  ],
  highlights: [
    'Carbon-fibre roof',
    'Adaptive M suspension',
    'M Compound brakes',
    'M Sport differential',
    'M Drift Analyzer & Laptimer',
    'Curved Display with iDrive 8.5',
  ],
}

export const X_MODELS = [
  {
    id: 'x1',
    name: 'BMW X1',
    series: 'Sports Activity Vehicle',
    categories: ['sav', 'm'],
    tagline: 'The compact SAV that does it all.',
    description:
      'Big-car technology in a city-friendly footprint. The X1 pairs a punchy 2.0-litre turbo with standard xDrive, a floating armrest and the BMW Curved Display — and the M35i turns it into a genuine hot hatch on stilts.',
    startingPrice: 43200,
    look: { paint: '#eceeed', paintName: 'Alpine White' },
    trims: [
      { name: 'X1 xDrive28i', drive: 'AWD', power: '241 hp', accel: '6.2 s', price: 43200 },
      { name: 'X1 M35i xDrive', drive: 'AWD', power: '312 hp', accel: '5.2 s', price: 51900 },
    ],
    specs: [
      ['Seats', '5'],
      ['Cargo', '25.7 – 57.2 cu ft'],
      ['Engine', '2.0L TwinPower Turbo 4-cyl.'],
      ['Fuel economy', 'up to 25 / 34 mpg city / hwy'],
    ],
    highlights: ['Standard xDrive AWD', 'BMW Curved Display', 'Floating armrest', 'Power tailgate'],
  },
  {
    id: 'x2',
    name: 'BMW X2',
    series: 'Sports Activity Coupe',
    categories: ['sac', 'm'],
    tagline: 'Coupé lines, SUV confidence.',
    description:
      'The X2 trades a little headroom for a lot of attitude. Its fastback roofline, large kidney grille and sporty seating position make it the most expressive compact BMW — with more cargo room than ever before.',
    startingPrice: 44700,
    look: { paint: '#0c0e12', paintName: 'Black Sapphire metallic' },
    trims: [
      { name: 'X2 xDrive28i', drive: 'AWD', power: '241 hp', accel: '6.2 s', price: 44700 },
      { name: 'X2 M35i xDrive', drive: 'AWD', power: '312 hp', accel: '5.2 s', price: 53100 },
    ],
    specs: [
      ['Seats', '5'],
      ['Cargo', '25.3 – 51.7 cu ft'],
      ['Engine', '2.0L TwinPower Turbo 4-cyl.'],
      ['Fuel economy', 'up to 24 / 33 mpg city / hwy'],
    ],
    highlights: ['Fastback roofline', 'Illuminated kidney grille', 'M Sport seats', 'Harman Kardon audio'],
  },
  {
    id: 'x3',
    name: 'BMW X3',
    series: 'Sports Activity Vehicle',
    categories: ['sav', 'm'],
    tagline: 'The benchmark mid-size SAV, redesigned.',
    description:
      'The all-new X3 is larger, sharper and more efficient. A 48-volt mild hybrid supports every engine, the cabin is wrapped in sustainable materials, and the six-cylinder M50 delivers M performance with family-car practicality.',
    startingPrice: 51300,
    look: { paint: '#cfccc6', paintName: 'Dune Grey metallic' },
    trims: [
      { name: 'X3 30 xDrive', drive: 'AWD', power: '255 hp', accel: '5.6 s', price: 51300 },
      { name: 'X3 M50 xDrive', drive: 'AWD', power: '393 hp', accel: '4.4 s', price: 66100 },
    ],
    specs: [
      ['Seats', '5'],
      ['Cargo', '31.5 – 62.7 cu ft'],
      ['Engine', '2.0L 4-cyl. / 3.0L 6-cyl. mild hybrid'],
      ['Fuel economy', 'up to 25 / 32 mpg city / hwy'],
    ],
    highlights: ['48V mild-hybrid', 'Iconic Glow kidney grille', 'Panoramic sunroof', 'Driving Assistant Professional'],
  },
  {
    id: 'x5',
    name: 'BMW X5',
    series: 'Sports Activity Vehicle',
    categories: ['sav', 'm', 'electric'],
    tagline: 'The original Sports Activity Vehicle.',
    description:
      'Twenty-five years after it invented the segment, the X5 is still the reference. Choose a silky inline-six, the plug-in hybrid xDrive50e with around 40 miles of electric range, the V8 M60i — or the 617-hp X5 M Competition.',
    startingPrice: 68300,
    look: { paint: '#8a8574', paintName: 'Dravit Grey metallic' },
    trims: [
      { name: 'X5 sDrive40i', drive: 'RWD', power: '375 hp', accel: '5.4 s', price: 68300 },
      { name: 'X5 xDrive40i', drive: 'AWD', power: '375 hp', accel: '5.3 s', price: 70600 },
      { name: 'X5 xDrive50e (PHEV)', drive: 'AWD', power: '483 hp', accel: '4.6 s', price: 75200 },
      { name: 'X5 M60i xDrive', drive: 'AWD', power: '523 hp', accel: '4.2 s', price: 93000 },
      { name: 'X5 M Competition', drive: 'AWD', power: '617 hp', accel: '3.7 s', price: 128000 },
    ],
    specs: [
      ['Seats', '5 (7 optional)'],
      ['Cargo', '33.9 – 72.3 cu ft'],
      ['Engines', '3.0L I6 · PHEV · 4.4L V8'],
      ['Towing', 'up to 7,200 lbs'],
    ],
    highlights: ['Plug-in hybrid option', 'Adaptive 2-axle air suspension', 'Sky Lounge panoramic roof', 'Bowers & Wilkins audio'],
  },
  {
    id: 'x6',
    name: 'BMW X6',
    series: 'Sports Activity Coupe',
    categories: ['sac', 'm'],
    tagline: 'The coupé that redefined the SUV.',
    description:
      'Muscular shoulders, a dramatic sloping roof and an optional illuminated kidney grille make the X6 impossible to ignore. Underneath it shares the X5’s brilliant chassis, from the mild-hybrid six to the 617-hp X6 M Competition.',
    startingPrice: 77300,
    look: { paint: '#8b9096', paintName: 'Brooklyn Grey metallic' },
    trims: [
      { name: 'X6 xDrive40i', drive: 'AWD', power: '375 hp', accel: '5.3 s', price: 77300 },
      { name: 'X6 M60i xDrive', drive: 'AWD', power: '523 hp', accel: '4.2 s', price: 99000 },
      { name: 'X6 M Competition', drive: 'AWD', power: '617 hp', accel: '3.7 s', price: 131000 },
    ],
    specs: [
      ['Seats', '5'],
      ['Cargo', '27.4 – 59.6 cu ft'],
      ['Engines', '3.0L I6 · 4.4L V8'],
      ['Wheels', '20" – 22"'],
    ],
    highlights: ['Iconic Glow kidney grille', 'M Sport differential', 'Sky Lounge panoramic roof', 'Soft-close doors'],
  },
  {
    id: 'x7',
    name: 'BMW X7',
    series: 'Sports Activity Vehicle',
    categories: ['sav', 'm'],
    tagline: 'Three rows of pure luxury.',
    description:
      'The flagship BMW SAV seats up to seven in first-class comfort. Split headlights, a crystal gear selector and executive lounge seating set the tone, while the M60i and ALPINA XB7 prove that size never has to slow you down.',
    startingPrice: 87500,
    look: { paint: '#1e2a4d', paintName: 'Tanzanite Blue metallic' },
    trims: [
      { name: 'X7 xDrive40i', drive: 'AWD', power: '375 hp', accel: '5.6 s', price: 87500 },
      { name: 'X7 M60i xDrive', drive: 'AWD', power: '523 hp', accel: '4.5 s', price: 113800 },
      { name: 'ALPINA XB7', drive: 'AWD', power: '631 hp', accel: '4.0 s', price: 154500 },
    ],
    specs: [
      ['Seats', '6 or 7'],
      ['Cargo', '12.8 – 81.0 cu ft'],
      ['Engines', '3.0L I6 · 4.4L V8'],
      ['Towing', 'up to 7,500 lbs'],
    ],
    highlights: ['Three-row seating', 'Executive Lounge option', 'Crystal controls', 'Five-zone climate'],
  },
  {
    id: 'xm',
    name: 'BMW XM',
    series: 'M High-Performance SAV',
    categories: ['sav', 'm', 'electric'],
    tagline: 'The most powerful BMW M ever built.',
    description:
      'The XM is BMW M’s first standalone model since the M1. A 4.4-litre twin-turbo V8 joins forces with an electric motor for up to 738 hp in the XM Label, wrapped in an unmistakable design with an M Lounge rear cabin.',
    startingPrice: 159600,
    look: { paint: '#3d4a40', paintName: 'Cape York Green metallic' },
    trims: [
      { name: 'XM', drive: 'AWD', power: '644 hp', accel: '4.1 s', price: 159600 },
      { name: 'XM Label', drive: 'AWD', power: '738 hp', accel: '3.7 s', price: 187500 },
    ],
    specs: [
      ['Seats', '5'],
      ['Powertrain', '4.4L V8 plug-in hybrid'],
      ['Electric range', 'about 30 miles'],
      ['Wheels', '22" – 23"'],
    ],
    highlights: ['Plug-in hybrid V8', 'M Lounge rear cabin', 'Active roll stabilisation', 'Integral active steering'],
  },
  {
    id: 'ix',
    name: 'BMW iX',
    series: 'Electric Sports Activity Vehicle',
    categories: ['sav', 'electric', 'm'],
    tagline: 'All-electric. All BMW.',
    description:
      'Designed from a blank sheet as an EV, the iX combines a minimalist, lounge-like cabin with up to roughly 340 miles of EPA-estimated range. Over-the-air updates keep it fresh, and the iX M70 delivers M-level acceleration in total silence.',
    startingPrice: 75150,
    look: { paint: '#8e9296', paintName: 'Frozen Pure Grey (matte)' },
    trims: [
      { name: 'iX xDrive45', drive: 'AWD', power: '402 hp', accel: '4.9 s', price: 75150 },
      { name: 'iX xDrive60', drive: 'AWD', power: '536 hp', accel: '4.4 s', price: 88500 },
      { name: 'iX M70 xDrive', drive: 'AWD', power: '650 hp', accel: '3.6 s', price: 111500 },
    ],
    specs: [
      ['Seats', '5'],
      ['Range (EPA est.)', 'up to ~340 miles'],
      ['DC fast charging', '10–80% in about 35 min'],
      ['Cargo', '35.5 – 77.9 cu ft'],
    ],
    highlights: ['Zero tailpipe emissions', 'Shy Tech cabin', 'Over-the-air updates', 'Plug & Charge'],
  },
]

export const FILTERS = [
  { id: 'all', label: 'All models' },
  { id: 'sav', label: 'SAV' },
  { id: 'sac', label: 'Coupe SUVs' },
  { id: 'electric', label: 'Electrified' },
  { id: 'm', label: 'M Performance' },
]

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
