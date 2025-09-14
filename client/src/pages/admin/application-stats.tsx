import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, XCircle, BarChart4, PieChart, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

// Simple bar chart component
const BarChartComponent = ({ 
  data, 
  keys = ['value'], 
  height = 200, 
  title, 
  description
}: { 
  data: any[], 
  keys?: string[], 
  height?: number, 
  title?: string,
  description?: string
}) => {
  const maxValue = Math.max(...data.flatMap(item => keys.map(key => item[key] || 0)));
  
  return (
    <div className="mt-4">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      <div style={{ height: `${height}px` }} className="relative">
        <div className="flex h-full items-end">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center">
              {keys.map((key, keyIndex) => (
                <div 
                  key={`${idx}-${keyIndex}`}
                  style={{ 
                    height: `${(item[key] / maxValue) * 100}%`,
                    backgroundColor: keyIndex === 0 ? '#8a63d2' : '#e2d4f7',
                    opacity: keyIndex === 0 ? 1 : 0.7 + (0.1 * keyIndex)
                  }}
                  className="w-4/5 rounded-t"
                >
                  <div className="text-xs text-white text-center font-medium pt-1">
                    {item[key] > 0 && item[key]}
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple pie chart component
const PieChartComponent = ({ 
  data, 
  title, 
  description 
}: { 
  data: { label: string; value: number; color: string }[],
  title?: string,
  description?: string
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate each slice's percentage and start position
  let cumulativePercentage = 0;
  const chartData = data.map(item => {
    const percentage = (item.value / total) * 100;
    const startPercentage = cumulativePercentage;
    cumulativePercentage += percentage;
    
    return {
      ...item,
      percentage,
      startPercentage,
      endPercentage: cumulativePercentage
    };
  });

  return (
    <div className="mt-4">
      {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      
      <div className="flex">
        {/* Pie chart */}
        <div className="relative h-48 w-48 rounded-full overflow-hidden">
          {total === 0 ? (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No data</span>
            </div>
          ) : (
            chartData.map((item, idx) => (
              <div
                key={idx}
                className="absolute inset-0"
                style={{
                  background: item.color,
                  clipPath: `conic-gradient(from 0deg, transparent ${item.startPercentage}%, ${item.color} ${item.startPercentage}%, ${item.color} ${item.endPercentage}%, transparent ${item.endPercentage}%)`
                }}
              />
            ))
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 bg-background rounded-full flex items-center justify-center text-sm">
              <div className="text-center">
                <div className="font-bold text-2xl">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="ml-4 flex-1">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <div 
                className="h-3 w-3 rounded-sm mr-2"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-sm flex-1">{item.label}</div>
              <div className="text-sm font-semibold">{item.value}</div>
              <div className="text-xs text-gray-500 ml-2">
                ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  footer,
  trend,
  trendLabel
}: { 
  title: string; 
  value: number | string; 
  description?: string; 
  icon: React.ElementType; 
  footer?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}) => (
  <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}% {trendLabel || ''}
          </div>
        )}
      </div>
    </CardContent>
    {footer && <CardFooter className="mt-auto">{footer}</CardFooter>}
  </Card>
);

export default function ApplicationStatsPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState('week');

  // Query to fetch application statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/livestreamer-applications/stats'],
    retry: false,
    enabled: isAuthenticated && user?.isAdmin,
  });

  // Query to fetch detailed application data
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/admin/applications/livestreamer'],
    retry: false,
    enabled: isAuthenticated && user?.isAdmin,
  });

  const [, setLocation] = useLocation();
  
  // Check if user is admin
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  // If data is still loading, show loading state
  if (isLoadingStats || isLoadingApplications) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-2" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Application Statistics</h1>
        </div>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Process application data for visualizations
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

  // Create data for trends by day/week
  const createDateFilteredData = () => {
    if (!applications) return [];
    
    let days = 7;
    if (timeRange === 'month') days = 30;
    if (timeRange === 'year') days = 365;
    
    const dateData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, timeRange === 'year' ? 'MMM' : 'MMM d');
      
      const dayApplications = applications.filter(app => {
        const appDate = new Date(app.createdAt);
        if (timeRange === 'year') {
          return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
        }
        return appDate.getDate() === date.getDate() && 
               appDate.getMonth() === date.getMonth() && 
               appDate.getFullYear() === date.getFullYear();
      });
      
      const approved = dayApplications.filter(app => app.status === 'approved').length;
      const rejected = dayApplications.filter(app => app.status === 'rejected').length;
      const pending = dayApplications.filter(app => app.status === 'pending').length;
      
      dateData.push({
        label: dateStr,
        total: dayApplications.length,
        approved,
        rejected,
        pending
      });
    }
    
    return dateData;
  };

  const dateData = createDateFilteredData();
  
  // Process status distribution
  const statusDistribution = [
    { label: 'Pending', value: stats?.pending || 0, color: '#f59e0b' },
    { label: 'Approved', value: stats?.approved || 0, color: '#10b981' },
    { label: 'Rejected', value: stats?.rejected || 0, color: '#ef4444' }
  ];

  // Calculate processing times
  const processedApplications = applications?.filter(app => app.status !== 'pending' && app.reviewedAt) || [];
  let avgProcessingTime = 0;
  
  if (processedApplications.length > 0) {
    const totalProcessingTime = processedApplications.reduce((total, app) => {
      const submitDate = new Date(app.createdAt);
      const reviewDate = new Date(app.reviewedAt);
      return total + (reviewDate.getTime() - submitDate.getTime());
    }, 0);
    
    avgProcessingTime = totalProcessingTime / processedApplications.length / (1000 * 60 * 60); // in hours
  }

  // Calculate trends
  const last30DaysApps = applications?.filter(app => {
    const appDate = new Date(app.createdAt);
    return differenceInDays(now, appDate) <= 30;
  }).length || 0;
  
  const previous30DaysApps = applications?.filter(app => {
    const appDate = new Date(app.createdAt);
    const daysAgo = differenceInDays(now, appDate);
    return daysAgo > 30 && daysAgo <= 60;
  }).length || 0;
  
  const monthlyTrend = previous30DaysApps > 0 
    ? Math.round(((last30DaysApps - previous30DaysApps) / previous30DaysApps) * 100) 
    : last30DaysApps > 0 ? 100 : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="mr-2" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Application Statistics</h1>
      </div>

      {/* Top stats cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Applications" 
          value={stats?.total || 0}
          description="All time total applications received" 
          icon={BarChart4}
          trend={monthlyTrend}
          trendLabel="last 30 days"
        />
        <StatCard 
          title="Pending Applications" 
          value={stats?.pending || 0}
          description="Applications awaiting review" 
          icon={AlertCircle}
          footer={
            <Button asChild className="w-full">
              <Link href="/admin/livestreamer-applications">Review Applications</Link>
            </Button>
          }
        />
        <StatCard 
          title="Approval Rate" 
          value={`${stats?.total > 0 ? Math.round((stats?.approved / stats?.total) * 100) : 0}%`}
          description="Percentage of approved applications" 
          icon={CheckCircle}
        />
        <StatCard 
          title="Avg. Processing Time" 
          value={`${avgProcessingTime.toFixed(1)} hrs`}
          description="Average time to process applications" 
          icon={Calendar}
        />
      </div>

      {/* Charts section */}
      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Application Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of applications by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChartComponent 
              data={statusDistribution}
            />
          </CardContent>
        </Card>

        {/* Application Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              Application Submission Trends
            </CardTitle>
            <CardDescription>
              Number of applications received over time
            </CardDescription>
            <Tabs value={timeRange} onValueChange={setTimeRange} className="mt-2">
              <TabsList>
                <TabsTrigger value="week">Last Week</TabsTrigger>
                <TabsTrigger value="month">Last Month</TabsTrigger>
                <TabsTrigger value="year">Last Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <BarChartComponent 
              data={dateData}
              keys={['total']}
              height={180}
            />
          </CardContent>
        </Card>
      </div>

      {/* Application processing breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart4 className="h-5 w-5 text-primary" />
            Application Processing Breakdown
          </CardTitle>
          <CardDescription>
            Breakdown of processed applications by status over time
          </CardDescription>
          <Tabs value={timeRange} onValueChange={setTimeRange} className="mt-2">
            <TabsList>
              <TabsTrigger value="week">Last Week</TabsTrigger>
              <TabsTrigger value="month">Last Month</TabsTrigger>
              <TabsTrigger value="year">Last Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <BarChartComponent 
            data={dateData}
            keys={['approved', 'rejected', 'pending']}
            height={250}
          />
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-[#8a63d2] rounded-sm mr-1"></div>
              <span className="text-xs">Approved</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-[#ef4444] rounded-sm mr-1"></div>
              <span className="text-xs">Rejected</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-[#f59e0b] rounded-sm mr-1"></div>
              <span className="text-xs">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-4 justify-end">
        <Button asChild>
          <Link href="/admin/livestreamer-applications">
            Review Applications
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}