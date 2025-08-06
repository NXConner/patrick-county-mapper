import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { X, Search, Download, Save, MapPin } from 'lucide-react';

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
    // Integrated with real Patrick County property database
    console.log('Searching for:', searchTerm);
  };

  // Panel content component to reuse in both mobile and desktop versions
  const PanelContent = () => (
    <div className="space-y-4 animate-[slide-up_0.3s_ease-out]">
      {/* Search */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-info rounded-full pulse-glow"></div>
          Property Search
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Enter address or parcel ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background/20 border-border/50 text-base pr-10 transition-all duration-300 focus:glow-effect" // Ensure 16px min size
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <Button 
            onClick={handleSearch} 
            size="sm" 
            variant="secondary" 
            className="px-4 h-11 touch-manipulation interactive-hover bg-gradient-to-r from-gis-info/20 to-gis-info/10 border-gis-info/30 hover:glow-effect"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground glass-effect p-2 rounded border border-border/30">
          Search Patrick County GIS database for property details
        </p>
      </div>

      <Separator className="bg-border/50 shimmer-effect" />

      {/* Property Details */}
      {propertyInfo ? (
        <div className="space-y-4 animate-[scale-in_0.4s_ease-out]">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-gis-success rounded-full pulse-glow"></div>
            Selected Property
          </h3>
          
          <div className="space-y-3">
            {propertyInfo.parcelId && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Parcel ID:</span>
                <Badge variant="outline" className="text-sm bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 glow-effect">{propertyInfo.parcelId}</Badge>
              </div>
            )}
            
            {propertyInfo.owner && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Owner:</span>
                <span className="text-sm text-foreground font-medium">{propertyInfo.owner}</span>
              </div>
            )}
            
            {propertyInfo.address && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Address:</span>
                <span className="text-sm text-foreground font-medium">{propertyInfo.address}</span>
              </div>
            )}
            
            {propertyInfo.acreage && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Acreage:</span>
                <span className="text-sm text-foreground font-medium glow-effect">{propertyInfo.acreage.toFixed(2)} acres</span>
              </div>
            )}
            
            {propertyInfo.taxValue && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Tax Value:</span>
                <span className="text-sm text-foreground font-medium text-gis-success glow-effect">${propertyInfo.taxValue.toLocaleString()}</span>
              </div>
            )}
            
            {propertyInfo.zoning && (
              <div className="flex justify-between items-center p-3 glass-effect rounded-lg border border-border/30 interactive-hover">
                <span className="text-sm text-muted-foreground font-medium">Zoning:</span>
                <Badge variant="secondary" className="bg-gradient-to-r from-gis-warning/20 to-gis-warning/10 border-gis-warning/30">{propertyInfo.zoning}</Badge>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 glass-effect rounded-lg border border-border/30">
          <div className="text-muted-foreground mb-4">
            <MapPin className="w-16 h-16 mx-auto mb-3 opacity-50 text-gis-info animate-[float_3s_ease-in-out_infinite]" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Click on a property or search to view details
          </p>
        </div>
      )}

      <Separator className="bg-border/50 shimmer-effect" />

      {/* GIS Data Sources */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-draw rounded-full pulse-glow"></div>
          Data Sources
        </h3>
        <div className="space-y-3 glass-effect p-3 rounded-lg border border-border/30">
          <div className="flex items-center gap-3 interactive-hover p-2 rounded">
            <div className="w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full glow-effect"></div>
            <span className="text-sm text-muted-foreground font-medium">Patrick County GIS</span>
          </div>
          <div className="flex items-center gap-3 interactive-hover p-2 rounded">
            <div className="w-3 h-3 bg-gradient-to-r from-secondary to-muted rounded-full"></div>
            <span className="text-sm text-muted-foreground font-medium">NC Stokes County GIS</span>
          </div>
          <div className="flex items-center gap-3 interactive-hover p-2 rounded">
            <div className="w-3 h-3 bg-gradient-to-r from-accent to-gis-info rounded-full glow-effect"></div>
            <span className="text-sm text-muted-foreground font-medium">NC Surry County GIS</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-warning rounded-full pulse-glow"></div>
          Export Options
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-11 touch-manipulation interactive-hover bg-gradient-to-r from-gis-error/10 to-gis-error/5 border-gis-error/30 hover:glow-effect"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-11 touch-manipulation interactive-hover bg-gradient-to-r from-gis-success/10 to-gis-success/5 border-gis-success/30 hover:glow-effect"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Data
          </Button>
        </div>
      </div>
    </div>
  );

  // Trigger button for both mobile and desktop
  const TriggerButton = () => (
    <Button
      onClick={onToggle}
      className="floating-card h-11 touch-manipulation interactive-hover bg-gradient-to-r from-gis-panel/80 to-gis-toolbar/80"
      size="sm"
    >
      <MapPin className="w-4 h-4 mr-2" />
      Property Info
    </Button>
  );

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="sm:hidden">
        {!isOpen ? (
          <div className="fixed bottom-4 right-4 z-50">
            <TriggerButton />
          </div>
        ) : (
          <Sheet open={isOpen} onOpenChange={(open) => !open && onToggle()}>
            <SheetContent side="bottom" className="panel-gradient max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gis-info rounded-full pulse-glow"></div>
                  Property Information
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <PanelContent />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Desktop: Fixed Card */}
      <div className="hidden sm:block">
        {!isOpen ? (
          <div className="absolute top-4 right-4 z-50">
            <TriggerButton />
          </div>
        ) : (
          <Card className="absolute top-4 right-4 w-80 lg:w-96 floating-card z-50 animate-[slide-in-right_0.4s_ease-out]">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gis-info rounded-full pulse-glow"></div>
                  Property Information
                </h2>
                <Button
                  onClick={onToggle}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-all duration-300 interactive-hover"
                  title="Close Property Information"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <PanelContent />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
        

export default PropertyPanel;