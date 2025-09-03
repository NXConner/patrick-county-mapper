import React from 'react';

interface ServiceInfoProps {
  className?: string;
}

const ServiceInfo: React.FC<ServiceInfoProps> = ({ className = "" }) => {
  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
        <span>Service Information</span>
      </div>
      <div className="mt-1">
        <span>Serving Patrick County, VA; Henry County, VA; Stokes & Surry, NC</span>
      </div>
    </div>
  );
};

export default ServiceInfo;