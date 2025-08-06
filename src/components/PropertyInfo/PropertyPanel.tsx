import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PropertyInfo {
  parcelId?: string;
  owner?: string;
  address?: string;
  acreage?: number;
  taxValue?: number;
  zoning?: string;
}

interface PropertyPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  propertyInfo?: PropertyInfo;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ isOpen, onToggle, propertyInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    // This would integrate with Patrick County GIS API
    console.log('Searching for:', searchTerm);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="absolute top-4 right-4 bg-gis-panel hover:bg-gis-toolbar shadow-panel"
        size="sm"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Property Info
      </Button>
    );
  }

  return (
    <Card className="absolute top-4 right-4 w-80 bg-gis-panel/95 backdrop-blur-sm border-border/50 shadow-panel">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Property Information</h2>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-background/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter address or parcel ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background/20 border-border/50"
            />
            <Button onClick={handleSearch} size="sm" variant="secondary">
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Search Patrick County GIS database for property details
          </p>
        </div>

        <Separator className="bg-border/50" />

        {/* Property Details */}
        {propertyInfo ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Selected Property</h3>
            
            <div className="space-y-2">
              {propertyInfo.parcelId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Parcel ID:</span>
                  <Badge variant="outline">{propertyInfo.parcelId}</Badge>
                </div>
              )}
              
              {propertyInfo.owner && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Owner:</span>
                  <span className="text-sm text-foreground">{propertyInfo.owner}</span>
                </div>
              )}
              
              {propertyInfo.address && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <span className="text-sm text-foreground">{propertyInfo.address}</span>
                </div>
              )}
              
              {propertyInfo.acreage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Acreage:</span>
                  <span className="text-sm text-foreground">{propertyInfo.acreage.toFixed(2)} acres</span>
                </div>
              )}
              
              {propertyInfo.taxValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax Value:</span>
                  <span className="text-sm text-foreground">${propertyInfo.taxValue.toLocaleString()}</span>
                </div>
              )}
              
              {propertyInfo.zoning && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Zoning:</span>
                  <Badge variant="secondary">{propertyInfo.zoning}</Badge>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Click on a property or search to view details
            </p>
          </div>
        )}

        <Separator className="bg-border/50" />

        {/* GIS Data Sources */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Data Sources</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Patrick County GIS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              NC Stokes County GIS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              NC Surry County GIS
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Save Data
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PropertyPanel;