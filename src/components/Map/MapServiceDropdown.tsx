import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import type { MapService } from '@/data/mapServices';
import { mapServices } from '@/data/mapServices';

interface MapServiceDropdownProps {
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
  className?: string;
}

const MapServiceDropdown: React.FC<MapServiceDropdownProps> = ({
  selectedService,
  onServiceChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedServiceData = mapServices.find(service => service.id === selectedService);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'freemium': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'limited': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground hidden md:block">
        Mapping Service
      </label>
      <Select value={selectedService} onValueChange={onServiceChange} onOpenChange={setIsOpen}>
        <SelectTrigger className="select-enhanced w-full h-11 text-base touch-manipulation" data-testid="map-service-dropdown">
          <SelectValue placeholder="Select mapping service">
            {selectedServiceData && (
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${selectedServiceData.type === 'free' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                  {selectedServiceData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{selectedServiceData.name}</span>
                    {selectedServiceData.type === 'free' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        FREE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedServiceData.description}
                  </p>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="menu-enhanced max-h-[400px] w-[380px] overflow-y-auto scrollbar-enhanced">
          <div className="p-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Mapping Services</h3>
              <Badge variant="outline" className="text-xs">
                {mapServices.length} Services
              </Badge>
            </div>
            
            <div className="space-y-2">
              {mapServices.map((service) => (
                <SelectItem 
                  key={service.id} 
                  value={service.id}
                  className="text-foreground hover:bg-muted/50 focus:bg-muted/50 py-3 px-3 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`p-2 rounded-lg ${service.type === 'free' ? 'bg-green-500/20' : 'bg-blue-500/20'} flex-shrink-0`}>
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{service.name}</span>
                        <div className="flex gap-1">
                          {service.type === 'free' && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              FREE
                            </Badge>
                          )}
                          {service.type === 'freemium' && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                              FREE TIER
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${getQualityColor(service.quality || 'medium')}`}>
                            {service.quality?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {service.description}
                      </p>
                      {service.features && (
                        <div className="flex flex-wrap gap-1">
                          {service.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {feature}
                            </span>
                          ))}
                          {service.features.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{service.features.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {service.id === selectedService && (
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          </div>
        </SelectContent>
      </Select>
      
      {selectedServiceData && (
        <div className="text-xs text-muted-foreground hidden lg:block space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedServiceData.type === 'free' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span className="font-medium">{selectedServiceData.name}</span>
          </div>
          <p className="text-xs">{selectedServiceData.description}</p>
          {selectedServiceData.url && (
            <a 
              href={selectedServiceData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 transition-colors duration-200"
            >
              <ExternalLink className="w-3 h-3" />
              Learn more
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default MapServiceDropdown;