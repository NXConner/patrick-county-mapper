import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Home, 
  Building, 
  Download,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { PropertyInfo } from '@/hooks/usePropertyData';
import { MeasurementData } from '@/hooks/useExportMeasurements';
import { getPropertyAnalytics } from '@/lib/propertyService';

interface AnalyticsDashboardProps {
  properties: PropertyInfo[];
  measurements: MeasurementData[];
  onExport?: (type: 'properties' | 'measurements' | 'analytics', format: string) => void;
}

interface PropertyStatistics {
  totalProperties: number;
  totalValue: number;
  totalAcreage: number;
  averageValue: number;
  averageAcreage: number;
  valuePerAcre: number;
  zoningBreakdown: { name: string; value: number; percentage: number }[];
  propertyTypeBreakdown: { name: string; value: number; percentage: number }[];
  valueRangeBreakdown: { range: string; count: number; percentage: number }[];
  yearBuiltTrend: { year: number; count: number }[];
  salesTrend: { month: string; averagePrice: number; salesCount: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  properties,
  measurements,
  onExport
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1y');
  const [selectedMetric, setSelectedMetric] = useState('value');

  // Calculate comprehensive statistics
  const statistics = useMemo((): PropertyStatistics => {
    if (properties.length === 0) {
      return {
        totalProperties: 0,
        totalValue: 0,
        totalAcreage: 0,
        averageValue: 0,
        averageAcreage: 0,
        valuePerAcre: 0,
        zoningBreakdown: [],
        propertyTypeBreakdown: [],
        valueRangeBreakdown: [],
        yearBuiltTrend: [],
        salesTrend: []
      };
    }

    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + p.taxValue, 0);
    const totalAcreage = properties.reduce((sum, p) => sum + p.acreage, 0);
    const averageValue = totalValue / totalProperties;
    const averageAcreage = totalAcreage / totalProperties;
    const valuePerAcre = totalValue / totalAcreage;

    // Zoning breakdown
    const zoningCounts = properties.reduce((acc, p) => {
      acc[p.zoning] = (acc[p.zoning] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const zoningBreakdown = Object.entries(zoningCounts).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalProperties) * 100
    }));

    // Property type breakdown
    const typeCounts = properties.reduce((acc, p) => {
      const type = p.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const propertyTypeBreakdown = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalProperties) * 100
    }));

    // Value range breakdown
    const valueRanges = [
      { min: 0, max: 50000, label: '$0-$50K' },
      { min: 50000, max: 100000, label: '$50K-$100K' },
      { min: 100000, max: 200000, label: '$100K-$200K' },
      { min: 200000, max: 500000, label: '$200K-$500K' },
      { min: 500000, max: Infinity, label: '$500K+' }
    ];

    const valueRangeBreakdown = valueRanges.map(range => {
      const count = properties.filter(p => 
        p.taxValue >= range.min && p.taxValue < range.max
      ).length;
      return {
        range: range.label,
        count,
        percentage: (count / totalProperties) * 100
      };
    });

    // Year built trend
    const yearBuiltCounts = properties
      .filter(p => p.yearBuilt)
      .reduce((acc, p) => {
        const decade = Math.floor(p.yearBuilt! / 10) * 10;
        acc[decade] = (acc[decade] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const yearBuiltTrend = Object.entries(yearBuiltCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    // Calculate real sales trend from property sales history
    const salesTrend = useMemo(() => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const trend = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        // Collect all sales for this month from all properties
        const monthSales: number[] = [];
        properties.forEach(property => {
          if (property.salesHistory) {
            property.salesHistory.forEach(sale => {
              if (sale.date >= monthDate && sale.date < nextMonthDate) {
                monthSales.push(sale.price);
              }
            });
          }
        });

        const salesCount = monthSales.length;
        const averagePrice = salesCount > 0 
          ? Math.round(monthSales.reduce((sum, price) => sum + price, 0) / salesCount)
          : 0;

        trend.push({
          month: monthNames[monthDate.getMonth()],
          averagePrice,
          salesCount
        });
      }

      return trend;
    }, [properties]);

    return {
      totalProperties,
      totalValue,
      totalAcreage,
      averageValue,
      averageAcreage,
      valuePerAcre,
      zoningBreakdown,
      propertyTypeBreakdown,
      valueRangeBreakdown,
      yearBuiltTrend,
      salesTrend
    };
  }, [properties]);

  // Measurement statistics
  const measurementStats = useMemo(() => {
    if (measurements.length === 0) return null;

    const totalMeasurements = measurements.length;
    const byType = measurements.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDistance = measurements
      .filter(m => m.type === 'distance')
      .reduce((sum, m) => sum + m.value, 0);

    const totalArea = measurements
      .filter(m => m.type === 'area')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      totalMeasurements,
      byType,
      totalDistance,
      totalArea,
      averageDistance: totalDistance / (byType.distance || 1),
      averageArea: totalArea / (byType.area || 1)
    };
  }, [measurements]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of property data and measurements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => onExport?.('analytics', 'pdf')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalProperties)}</div>
            <Badge variant="secondary" className="mt-1">
              Active Parcels
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalValue)}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCurrency(statistics.averageValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acreage</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAcreage.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {statistics.averageAcreage.toFixed(2)} acres
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value per Acre</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.valuePerAcre)}</div>
            <Badge variant="outline" className="mt-1">
              Market Rate
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="property-analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="property-analysis">Property Analysis</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
        </TabsList>

        <TabsContent value="property-analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Zoning Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Zoning Distribution
                </CardTitle>
                <CardDescription>Properties by zoning classification</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.zoningBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statistics.zoningBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Property Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Property Types
                </CardTitle>
                <CardDescription>Distribution by property type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.propertyTypeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Value Range Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Value Range Distribution
                </CardTitle>
                <CardDescription>Properties grouped by assessed value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.valueRangeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          {measurementStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Measurements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{measurementStats.totalMeasurements}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Distance: {measurementStats.byType.distance || 0} |
                    Area: {measurementStats.byType.area || 0} |
                    Points: {measurementStats.byType.point || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {(measurementStats.totalDistance / 5280).toFixed(2)} mi
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Avg: {(measurementStats.averageDistance / 5280).toFixed(3)} mi
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {(measurementStats.totalArea / 43560).toFixed(2)} ac
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Avg: {(measurementStats.averageArea / 43560).toFixed(3)} ac
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No measurement data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Sales Trend
                </CardTitle>
                <CardDescription>Average sale prices over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={statistics.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="averagePrice" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Year Built Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Construction Era</CardTitle>
                <CardDescription>Properties by decade built</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={statistics.yearBuiltTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
              <CardDescription>
                Patrick County vs. Regional Averages (Simulated Data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(statistics.averageValue)}
                  </div>
                  <p className="text-sm text-muted-foreground">Patrick County Avg</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.averageValue * 1.15)}
                  </div>
                  <p className="text-sm text-muted-foreground">Regional Avg</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(statistics.averageValue * 1.35)}
                  </div>
                  <p className="text-sm text-muted-foreground">State Avg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;