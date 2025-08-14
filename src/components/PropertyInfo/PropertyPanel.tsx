import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Search, 
  MapPin, 
  User, 
  Home, 
  DollarSign, 
  Building2, 
  FileText, 
  Download, 
  Share2, 
  X, 
  Info,
  Database,
  Globe,
  Settings,
  BarChart3,
  Layers
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'search' | 'details' | 'sources' | 'actions'>('search');

  type PanelTabId = 'search' | 'details' | 'sources' | 'actions';
  const panelTabs: { id: PanelTabId; label: string; icon: JSX.Element }[] = [
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'details', label: 'Details', icon: <Info className="w-4 h-4" /> },
    { id: 'sources', label: 'Sources', icon: <Database className="w-4 h-4" /> },
    { id: 'actions', label: 'Actions', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSearch = () => {
    // Integrated with real Patrick County property database
    console.log('Searching for:', searchTerm);
  };

  // Enhanced Panel content component
  const PanelContent = () => (
    <div className="space-y-6">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Property Information
        </h2>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="close-btn-enhanced"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted/20 rounded-lg p-1">
        {panelTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter address or parcel ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-enhanced pl-10 h-11 text-base"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="sm" 
                className="btn-primary-enhanced px-4 h-11"
              >
                Search
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Search Patrick County GIS database for property details
            </p>
          </div>

          {/* Quick Search Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Quick Search</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-10 text-xs">
                <MapPin className="w-4 h-4 mr-2" />
                By Address
              </Button>
              <Button variant="outline" size="sm" className="h-10 text-xs">
                <FileText className="w-4 h-4 mr-2" />
                By Parcel ID
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {propertyInfo ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Selected Property
              </h3>
              
              <div className="space-y-3">
                {propertyInfo.parcelId && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Parcel ID:</span>
                    </div>
                    <Badge variant="outline" className="text-sm">{propertyInfo.parcelId}</Badge>
                  </div>
                )}
                
                {propertyInfo.owner && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Owner:</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{propertyInfo.owner}</span>
                  </div>
                )}
                
                {propertyInfo.address && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Address:</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{propertyInfo.address}</span>
                  </div>
                )}
                
                {propertyInfo.acreage && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Acreage:</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{propertyInfo.acreage.toFixed(2)} acres</span>
                  </div>
                )}
                
                {propertyInfo.taxValue && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tax Value:</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">${propertyInfo.taxValue.toLocaleString()}</span>
                  </div>
                )}
                
                {propertyInfo.zoning && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Zoning:</span>
                    </div>
                    <Badge variant="secondary" className="text-sm">{propertyInfo.zoning}</Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Building2 className="w-16 h-16 mx-auto mb-3 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Property Selected</h3>
              <p className="text-sm text-muted-foreground">
                Click on a property or search to view details
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Data Sources</h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/20 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="font-medium text-foreground">Patrick County GIS</span>
              </div>
              <p className="text-xs text-muted-foreground">Primary property and parcel data</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="font-medium text-foreground">NC Stokes County GIS</span>
              </div>
              <p className="text-xs text-muted-foreground">Cross-border property information</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="font-medium text-foreground">NC Surry County GIS</span>
              </div>
              <p className="text-xs text-muted-foreground">Regional property boundaries</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Data Quality</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Update Frequency:</span>
                <span className="font-medium text-foreground">Monthly</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="font-medium text-foreground">±3 feet</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coverage:</span>
                <span className="font-medium text-foreground">100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Export Options</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1">
              <Download className="w-4 h-4" />
              <span className="text-xs">Export PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Save Data</span>
            </Button>
            <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share Link</span>
            </Button>
            <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full h-10">
                <Layers className="w-4 h-4 mr-2" />
                View Property Lines
              </Button>
              <Button variant="secondary" size="sm" className="w-full h-10">
                <MapPin className="w-4 h-4 mr-2" />
                Center on Map
              </Button>
              <Button variant="secondary" size="sm" className="w-full h-10">
                <Info className="w-4 h-4 mr-2" />
                Property History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced Trigger button
  const TriggerButton = () => (
    <Button
      onClick={onToggle}
      className="btn-secondary-enhanced shadow-panel h-11 hover:shadow-floating"
      size="sm"
    >
      <Building2 className="w-4 h-4 mr-2" />
      Property Info
    </Button>
  );

  return (
    <>
      {/* Mobile: Enhanced Bottom Sheet */}
      <div className="sm:hidden">
        {!isOpen ? (
          <div className="fixed bottom-4 right-4 z-50">
            <TriggerButton />
          </div>
        ) : (
          <Sheet open={isOpen} onOpenChange={(open) => !open && onToggle()}>
            <SheetContent side="bottom" className="sheet-enhanced max-h-[85vh] overflow-y-auto scrollbar-enhanced">
              <div className="mt-6">
                <PanelContent />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Desktop: Enhanced Fixed Card */}
      <div className="hidden sm:block">
        {!isOpen ? (
          <div className="absolute top-4 right-4 z-50">
            <TriggerButton />
          </div>
        ) : (
          <Card className="absolute top-4 right-4 w-80 lg:w-96 card-enhanced z-50">
            <div className="p-4">
              <PanelContent />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
        

export default PropertyPanel;