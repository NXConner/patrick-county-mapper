import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Zap, 
  Square, 
  AlertTriangle, 
  Eye, 
  BarChart3, 
  X, 
  Minimize2, 
  Maximize2,

} from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import ComputerVisionService, { AsphaltRegion } from './ComputerVisionService';

}

const EnhancedAsphaltDetector: React.FC<EnhancedAsphaltDetectorProps> = ({ 
  map, 

      }
    };
  }, [map]);


    if (!map) {
      toast.error('Map not available for analysis');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);


    try {
      // Get current map bounds and zoom
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      

      });

      detectionLayer.current.addLayer(polygon);
    });
  };


        </div>
      </div>
    `;
  };


          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"

    </Card>
  );
};

export default EnhancedAsphaltDetector;