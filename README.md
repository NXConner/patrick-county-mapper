# Patrick County GIS Pro

A modern, high-resolution mapping and measurement application focused on Patrick County, Virginia and surrounding areas.

## 🗺️ **Coverage Area**

### Virginia Counties
- **Patrick County** (Primary coverage area)
- **Carroll County**
- **Floyd County** 
- **Franklin County**
- **Henry County**

### North Carolina Counties
- **Stokes County**
- **Surry County**

## ✨ **Key Features**

### 🛰️ **High-Resolution Satellite Imagery**
- **ESRI World Imagery** as default (completely free, no API key required)
- **Google Satellite** and **Bing Satellite** options
- Up to **zoom level 20** for detailed property inspection
- Recent imagery updates with global coverage

### 🔍 **Address Search**
- **Free geocoding** powered by OpenStreetMap Nominatim
- Search addresses, places, and coordinates
- **Real-time suggestions** with auto-complete
- **Instant map navigation** to search results
- Covers all Patrick County + surrounding areas

### 📱 **Mobile Optimized**
- **Responsive design** for all screen sizes
- **Touch-friendly** interface for tablets and phones
- **Optimized layouts** for portrait and landscape modes
- **Android APK support** via Capacitor

### 📏 **Measurement Tools**
- **Area measurement** for driveways, parking lots, property boundaries
- **Distance measurement** for roads, fences, property lines
- **Point markers** for location marking
- **Export capabilities** to GeoJSON format

### 🎯 **Professional GIS Features**
- **Layer controls** for satellite, roads, labels, property lines
- **Scale control** with imperial measurements
- **High-precision** coordinate system
- **Property information panel** integration

## 🚀 **Getting Started**

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation
```bash
# Clone the repository
git clone https://github.com/NXConner/patrick-county-mapper.git
cd patrick-county-mapper

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
# Build web application
npm run build

# Build Android APK
npm run android:build
```

## 🔧 **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run cap:sync` - Sync changes to Capacitor
- `npm run cap:build` - Build web app and sync with Capacitor
- `npm run android:build` - Build Android APK
- `npm run android:dev` - Build and run on Android device

## 🗺️ **Map Services**

- **ESRI World Imagery** (Default) - High-resolution satellite imagery
- **Google Satellite** - Google's satellite imagery
- **OpenStreetMap** - Open source street maps
- **MapLibre GL JS** - Open source mapping library
- **LocationIQ** - Geocoding and mapping API
- **Jawg Maps** - Customizable mapping platform

## 📱 **Mobile App**

Generate Android APK using Capacitor:

```bash
npm run android:build
```

The APK will be generated in `android/app/build/outputs/apk/debug/`

## 🛠️ **Technology Stack**

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Leaflet** for interactive mapping
- **Tailwind CSS** for modern styling
- **shadcn/ui** for consistent UI components
- **Capacitor** for mobile app generation
- **OpenStreetMap Nominatim** for free geocoding

## ⚙️ Environment

Create `.env` with required keys and optional flags:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# Dev-only workers to simulate background processing
VITE_ENABLE_AI_WORKER=true
VITE_ENABLE_EXPORT_WORKER=true
# Optional: enable Stripe checkout on Billing page
VITE_STRIPE_PK=pk_test_xxx
```

## 🗂 Overlays (WMS)

Configure WMS overlays in `src/data/overlaySources.ts`:

```ts
export const OVERLAY_SOURCES = {
  zoning: { url: 'https://example.com/geoserver/wms', layers: 'zoning:districts' },
  flood: { url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/WmsServer', layers: '0' },
  soils: { url: 'https://sdmdataaccess.nrcs.usda.gov/Spatial/SDM.wms', layers: 'MapUnitRaster' }
}
```

## 🎯 **Use Cases**

- **Property surveying** and boundary measurement
- **Land development** planning and visualization
- **Agricultural** field mapping and measurement
- **Construction** site planning and area calculation
- **Real estate** property analysis and documentation
- **Emergency services** location and area assessment

## 🔒 **Privacy & Data**

- **Real property data** - Connected to Patrick County property database via Supabase
- **No user tracking** or data collection
- **Free services** - no API keys required for core functionality
- **Client-side processing** - measurements calculated locally
- **Open source** mapping data from OpenStreetMap
- **Live property information** - Tax assessments, ownership, sales history

## 📄 **License**

This project is licensed under the MIT License.

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 **Support**

For questions or support, please open an issue on GitHub.

---

**Patrick County GIS Pro** - Professional mapping tools for Patrick County, Virginia and surrounding areas.
