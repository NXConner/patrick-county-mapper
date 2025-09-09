import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Clock, 
  Activity, 
  UserCheck,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeeLocation {
  id: string;
  employee_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  device_id?: string;
}

interface Employee {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  status: string;
  position?: string;
  phone?: string;
  email?: string;
}

interface EmployeeTrackerProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  map?: L.Map | null;
}

const EmployeeTracker: React.FC<EmployeeTrackerProps> = ({ onLocationSelect, map }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
    loadEmployeeLocations();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const loadEmployeeLocations = async () => {
    try {
      // For demo purposes, create simulated locations for employees
      const simulatedLocations: EmployeeLocation[] = employees.map((emp, index) => ({
        id: `loc-${emp.id}`,
        employee_id: emp.id,
        latitude: 36.6837 + (Math.random() - 0.5) * 0.02, // Near Patrick County
        longitude: -80.2876 + (Math.random() - 0.5) * 0.02,
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(), // Within last hour
        accuracy: 5 + Math.random() * 10,
        device_id: `device-${index}`
      }));
      
      setEmployeeLocations(simulatedLocations);
    } catch (error) {
      console.error('Error loading employee locations:', error);
      toast.error('Failed to load employee locations');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeStatus = (employeeId: string) => {
    const recentLocation = employeeLocations.find(loc => 
      loc.employee_id === employeeId &&
      new Date(loc.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
    );
    
    return recentLocation ? 'active' : 'inactive';
  };

  const getLastLocation = (employeeId: string) => {
    return employeeLocations.find(loc => loc.employee_id === employeeId);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee.id);
    const location = getLastLocation(employee.id);
    
    if (location && onLocationSelect) {
      onLocationSelect({
        lat: location.latitude,
        lng: location.longitude
      });
      
      if (map) {
        map.setView([location.latitude, location.longitude], 16);
      }
    }
  };

  const toggleTracking = async () => {
    setTrackingEnabled(!trackingEnabled);
    toast.success(`Employee tracking ${!trackingEnabled ? 'enabled' : 'disabled'}`);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Employee Tracking
          </CardTitle>
          <Button
            onClick={toggleTracking}
            variant={trackingEnabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {trackingEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {trackingEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
            <div className="font-semibold text-green-700 dark:text-green-400">
              {employees.filter(emp => getEmployeeStatus(emp.id) === 'active').length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">Active</div>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-950/20 rounded">
            <div className="font-semibold text-gray-700 dark:text-gray-400">
              {employees.filter(emp => getEmployeeStatus(emp.id) === 'inactive').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-500">Inactive</div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
            <div className="font-semibold text-blue-700 dark:text-blue-400">
              {employees.length}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-500">Total</div>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {employees.map((employee) => {
            const status = getEmployeeStatus(employee.id);
            const location = getLastLocation(employee.id);
            const isSelected = selectedEmployee === employee.id;
            
            return (
              <div
                key={employee.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-primary/10 border-primary/50' 
                    : 'bg-card hover:bg-muted/50 border-border'
                }`}
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <Badge 
                      variant={status === 'active' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {status === 'active' ? (
                        <UserCheck className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {status}
                    </Badge>
                  </div>
                </div>
                
                {employee.position && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {employee.position}
                  </div>
                )}
                
                {location && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                
                {!location && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    No recent location data
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {employees.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No employees found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeTracker;