-- Create SQL functions for property data queries

-- Function to get properties within a radius (PostGIS)
CREATE OR REPLACE FUNCTION get_properties_within_radius(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_km DECIMAL DEFAULT 1.0
)
RETURNS TABLE (
  id UUID,
  parcel_id VARCHAR(50),
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
  area_sqft DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id, p.parcel_id, p.owner_name, p.property_address, p.acreage,
    p.tax_value, p.assessed_value, p.land_value, p.improvement_value, 
    p.market_value, p.zoning, p.property_type, p.year_built, 
    p.square_footage, p.school_district, p.flood_zone, p.soil_type,
    p.last_sale_date, p.last_sale_price, p.legal_description, 
    p.tax_year, p.latitude, p.longitude, p.area_sqft,
    p.created_at, p.updated_at
  FROM properties p
  WHERE p.geometry IS NOT NULL
    AND ST_DWithin(
      p.geometry, 
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326),
      radius_km * 1000 -- Convert km to meters
    )
  ORDER BY ST_Distance(
    p.geometry, 
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
  )
  LIMIT 50;
$$;

-- Function to get property statistics
CREATE OR REPLACE FUNCTION get_property_statistics()
RETURNS JSON
LANGUAGE SQL
AS $$
  SELECT json_build_object(
    'total_properties', COUNT(*),
    'total_value', COALESCE(SUM(tax_value), 0),
    'total_acreage', COALESCE(SUM(acreage), 0),
    'average_value', COALESCE(AVG(tax_value), 0),
    'average_acreage', COALESCE(AVG(acreage), 0),
    'zoning_breakdown', (
      SELECT json_object_agg(zoning, count)
      FROM (
        SELECT 
          COALESCE(zoning, 'Unknown') as zoning, 
          COUNT(*) as count
        FROM properties 
        GROUP BY zoning
      ) z
    ),
    'property_type_breakdown', (
      SELECT json_object_agg(property_type, count)
      FROM (
        SELECT 
          COALESCE(property_type, 'Unknown') as property_type, 
          COUNT(*) as count
        FROM properties 
        GROUP BY property_type
      ) pt
    )
  )
  FROM properties;
$$;

-- Function to search properties with full-text search
CREATE OR REPLACE FUNCTION search_properties_fulltext(
  search_query TEXT DEFAULT '',
  min_acreage DECIMAL DEFAULT NULL,
  max_acreage DECIMAL DEFAULT NULL,
  min_value DECIMAL DEFAULT NULL,
  max_value DECIMAL DEFAULT NULL,
  zoning_filter TEXT[] DEFAULT NULL,
  property_type_filter TEXT[] DEFAULT NULL,
  has_improvements BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  parcel_id VARCHAR(50),
  owner_name VARCHAR(255),
  property_address VARCHAR(500),
  acreage DECIMAL(10,4),
  tax_value DECIMAL(12,2),
  zoning VARCHAR(100),
  property_type VARCHAR(100),
  year_built INTEGER,
  relevance_score REAL
)
LANGUAGE SQL
AS $$
  SELECT 
    p.id, p.parcel_id, p.owner_name, p.property_address, 
    p.acreage, p.tax_value, p.zoning, p.property_type, p.year_built,
    CASE 
      WHEN search_query = '' THEN 1.0
      ELSE ts_rank(
        to_tsvector('english', 
          COALESCE(p.owner_name, '') || ' ' || 
          COALESCE(p.property_address, '') || ' ' ||
          COALESCE(p.parcel_id, '')
        ),
        plainto_tsquery('english', search_query)
      )
    END as relevance_score
  FROM properties p
  WHERE 
    (search_query = '' OR 
     to_tsvector('english', 
       COALESCE(p.owner_name, '') || ' ' || 
       COALESCE(p.property_address, '') || ' ' ||
       COALESCE(p.parcel_id, '')
     ) @@ plainto_tsquery('english', search_query))
    AND (min_acreage IS NULL OR p.acreage >= min_acreage)
    AND (max_acreage IS NULL OR p.acreage <= max_acreage)
    AND (min_value IS NULL OR p.tax_value >= min_value)
    AND (max_value IS NULL OR p.tax_value <= max_value)
    AND (zoning_filter IS NULL OR p.zoning = ANY(zoning_filter))
    AND (property_type_filter IS NULL OR p.property_type = ANY(property_type_filter))
    AND (has_improvements IS NULL OR 
         (has_improvements = true AND p.improvement_value > 0) OR
         (has_improvements = false AND (p.improvement_value IS NULL OR p.improvement_value = 0)))
  ORDER BY relevance_score DESC, p.tax_value DESC
  LIMIT 100;
$$;

-- Function to get recent property sales
CREATE OR REPLACE FUNCTION get_recent_property_sales(
  days_back INTEGER DEFAULT 180
)
RETURNS TABLE (
  property_id UUID,
  parcel_id VARCHAR(50),
  property_address VARCHAR(500),
  sale_date DATE,
  sale_price DECIMAL(12,2),
  buyer_name VARCHAR(255),
  seller_name VARCHAR(255)
)
LANGUAGE SQL
AS $$
  SELECT 
    ps.property_id,
    p.parcel_id,
    p.property_address,
    ps.sale_date,
    ps.sale_price,
    ps.buyer_name,
    ps.seller_name
  FROM property_sales ps
  JOIN properties p ON ps.property_id = p.id
  WHERE ps.sale_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ORDER BY ps.sale_date DESC;
$$;

-- Create full-text search index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_fulltext 
ON properties USING GIN (
  to_tsvector('english', 
    COALESCE(owner_name, '') || ' ' || 
    COALESCE(property_address, '') || ' ' ||
    COALESCE(parcel_id, '')
  )
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add more sample data for better testing
INSERT INTO properties (
  parcel_id, owner_name, property_address, acreage, tax_value, assessed_value, 
  land_value, improvement_value, market_value, zoning, property_type, year_built,
  square_footage, school_district, flood_zone, soil_type, last_sale_date, last_sale_price,
  legal_description, tax_year, latitude, longitude, area_sqft
) VALUES 
(
  '005-002-012', 'Blue Ridge Farm LLC', '2500 Jeb Stuart Hwy, Stuart, VA 24171',
  45.8, 280000, 280000, 220000, 60000, 295000, 'Agricultural', 'Farm', 1978,
  2800, 'Patrick County Public Schools', 'Zone X', 'Hayesville Clay', '2023-09-12', 275000,
  'FARM TRACT 12, BLUE RIDGE AGRICULTURAL DISTRICT',
  2024, 36.7012, -80.3125, 1995840
),
(
  '006-003-005', 'Mountain Creek Development', '850 Rock Castle Gorge Rd, Woolwine, VA 24185',
  12.3, 195000, 195000, 145000, 50000, 210000, 'Residential', 'Single Family', 2008,
  2200, 'Patrick County Public Schools', 'Zone AE', 'Fairview Fine Sandy Loam', '2022-12-03', 188000,
  'LOT 5, MOUNTAIN CREEK SUBDIVISION, PLAT BOOK 22, PAGE 156',
  2024, 36.7845, -80.2456, 535668
),
(
  '007-001-008', 'Meadows Family Trust', '445 Riverside Dr, Stuart, VA 24171',
  3.2, 210000, 210000, 65000, 145000, 225000, 'Residential', 'Single Family', 2015,
  2600, 'Patrick County Public Schools', 'Zone X', 'Udorthents', '2021-07-18', 198000,
  'LOT 8, RIVERSIDE ESTATES, DEED BOOK 628, PAGE 89',
  2024, 36.6758, -80.2612, 139392
);

-- Insert additional property sales for testing
INSERT INTO property_sales (property_id, sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page)
SELECT p.id, '2023-09-12', 275000, 'Blue Ridge Farm LLC', 'Old Farm Properties', 'DB-645', 'PG-234'
FROM properties p WHERE p.parcel_id = '005-002-012';

INSERT INTO property_sales (property_id, sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page)
SELECT p.id, '2022-12-03', 188000, 'Mountain Creek Development', 'Woolwine Holdings', 'DB-635', 'PG-67'
FROM properties p WHERE p.parcel_id = '006-003-005';

INSERT INTO property_sales (property_id, sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page)
SELECT p.id, '2021-07-18', 198000, 'Meadows Family Trust', 'Riverside LLC', 'DB-618', 'PG-145'
FROM properties p WHERE p.parcel_id = '007-001-008';

-- Update geometry for new properties
UPDATE properties SET geometry = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE geometry IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;