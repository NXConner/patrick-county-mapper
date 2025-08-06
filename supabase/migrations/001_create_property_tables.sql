-- Create property data tables for Patrick County GIS

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id VARCHAR(50) UNIQUE NOT NULL,
  owner_name VARCHAR(255),
  property_address VARCHAR(500),
  acreage DECIMAL(10,4),
  tax_value DECIMAL(12,2),
  assessed_value DECIMAL(12,2),
  land_value DECIMAL(12,2),
  improvement_value DECIMAL(12,2),
  market_value DECIMAL(12,2),
  zoning VARCHAR(100),
  property_type VARCHAR(100),
  year_built INTEGER,
  square_footage INTEGER,
  school_district VARCHAR(255),
  flood_zone VARCHAR(50),
  soil_type VARCHAR(100),
  last_sale_date DATE,
  last_sale_price DECIMAL(12,2),
  legal_description TEXT,
  tax_year INTEGER,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  geometry GEOMETRY(POINT, 4326),
  area_sqft DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property utilities junction table
CREATE TABLE IF NOT EXISTS property_utilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  utility_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property sales history
CREATE TABLE IF NOT EXISTS property_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  buyer_name VARCHAR(255),
  seller_name VARCHAR(255),
  deed_book VARCHAR(100),
  deed_page VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property assessments
CREATE TABLE IF NOT EXISTS property_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  assessment_year INTEGER NOT NULL,
  land_value DECIMAL(12,2),
  improvement_value DECIMAL(12,2),
  total_value DECIMAL(12,2),
  exemptions DECIMAL(12,2),
  taxable_value DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_name);
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(property_address);
CREATE INDEX IF NOT EXISTS idx_properties_zoning ON properties(zoning);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_geometry ON properties USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude);

-- Enable RLS (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_utilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (GIS data is typically public)
CREATE POLICY "Public read access for properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Public read access for property_utilities" ON property_utilities FOR SELECT USING (true);
CREATE POLICY "Public read access for property_sales" ON property_sales FOR SELECT USING (true);
CREATE POLICY "Public read access for property_assessments" ON property_assessments FOR SELECT USING (true);

-- Insert sample realistic data for Patrick County, VA
INSERT INTO properties (
  parcel_id, owner_name, property_address, acreage, tax_value, assessed_value, 
  land_value, improvement_value, market_value, zoning, property_type, year_built,
  square_footage, school_district, flood_zone, soil_type, last_sale_date, last_sale_price,
  legal_description, tax_year, latitude, longitude, area_sqft
) VALUES 
(
  '001-001-001', 'Johnson Family Trust', '123 Blue Ridge Pkwy, Stuart, VA 24171', 
  2.45, 165000, 165000, 55000, 110000, 175000, 'Residential', 'Single Family', 2018,
  2400, 'Patrick County Public Schools', 'Zone X', 'Cecil Clay Loam', '2021-03-15', 158000,
  'LOT 1, BLOCK A, BLUE RIDGE SUBDIVISION, AS RECORDED IN DEED BOOK 487, PAGE 123',
  2024, 36.6885, -80.2735, 106680
),
(
  '001-002-015', 'Stuart Town LLC', '456 Main Street, Stuart, VA 24171',
  0.85, 185000, 185000, 35000, 150000, 195000, 'Commercial', 'Retail', 2015,
  3200, 'Patrick County Public Schools', 'Zone AE', 'Udorthents', '2019-08-22', 175000,
  'PARCEL 15, STUART COMMERCIAL DISTRICT, PLAT BOOK 12, PAGE 45',
  2024, 36.6875, -80.2745, 37026
),
(
  '002-003-008', 'Mountain View Properties Inc', '789 Fairy Stone Park Rd, Stuart, VA 24171',
  15.75, 95000, 95000, 85000, 10000, 105000, 'Agricultural', 'Vacant Land', NULL,
  NULL, 'Patrick County Public Schools', 'Zone X', 'Fairview Fine Sandy Loam', '2020-11-30', 88000,
  'TRACT 8, MOUNTAIN VIEW FARM SUBDIVISION, DEED BOOK 502, PAGE 78',
  2024, 36.7125, -80.2855, 685890
),
(
  '003-001-022', 'Heritage Homes LLC', '321 County Road 615, Ararat, VA 24053',
  1.2, 142000, 142000, 25000, 117000, 155000, 'Residential', 'Manufactured Home', 2012,
  1800, 'Patrick County Public Schools', 'Zone X', 'Hayesville Clay Loam', '2022-05-18', 140000,
  'LOT 22, HERITAGE MOBILE HOME PARK, PLAT BOOK 18, PAGE 92',
  2024, 36.6558, -80.5025, 52272
),
(
  '004-005-001', 'Patrick County', '1000 Courthouse Square, Stuart, VA 24171',
  2.0, 750000, 750000, 150000, 600000, 850000, 'Institutional', 'Government', 1958,
  15000, 'Patrick County Public Schools', 'Zone X', 'Urban Land', NULL, NULL,
  'COURTHOUSE SQUARE, ORIGINAL PLAT OF STUART',
  2024, 36.6892, -80.2741, 87120
);

-- Insert utilities data
INSERT INTO property_utilities (property_id, utility_name)
SELECT p.id, unnest(ARRAY['Electric', 'Water', 'Sewer', 'Natural Gas'])
FROM properties p WHERE p.parcel_id = '001-001-001';

INSERT INTO property_utilities (property_id, utility_name)
SELECT p.id, unnest(ARRAY['Electric', 'Water', 'Sewer'])
FROM properties p WHERE p.parcel_id = '001-002-015';

INSERT INTO property_utilities (property_id, utility_name)
SELECT p.id, unnest(ARRAY['Electric'])
FROM properties p WHERE p.parcel_id = '002-003-008';

INSERT INTO property_utilities (property_id, utility_name)
SELECT p.id, unnest(ARRAY['Electric', 'Water', 'Septic'])
FROM properties p WHERE p.parcel_id = '003-001-022';

INSERT INTO property_utilities (property_id, utility_name)
SELECT p.id, unnest(ARRAY['Electric', 'Water', 'Sewer', 'Natural Gas', 'Internet'])
FROM properties p WHERE p.parcel_id = '004-005-001';

-- Insert sales history
INSERT INTO property_sales (property_id, sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page)
SELECT p.id, '2021-03-15', 158000, 'Johnson Family Trust', 'Mountain Vista LLC', 'DB-612', 'PG-45'
FROM properties p WHERE p.parcel_id = '001-001-001';

INSERT INTO property_sales (property_id, sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page)
SELECT p.id, '2019-08-22', 175000, 'Stuart Town LLC', 'Main Street Properties', 'DB-588', 'PG-127'
FROM properties p WHERE p.parcel_id = '001-002-015';

-- Update geometry column with calculated points
UPDATE properties SET geometry = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);