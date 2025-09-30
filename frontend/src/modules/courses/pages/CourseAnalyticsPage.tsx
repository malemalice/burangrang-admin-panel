import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  TrendingUp, 
  Eye,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { useCourse } from '../hooks/useCourses';
import { useCourseStats } from '../hooks/useCourses';
import courseService from '../services/courseService';
import { Course } from '../types/course.types';
import { formatCurrencyDisplay } from '@/shared/utils/currency';

const CourseAnalyticsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { course, isLoading: courseLoading, fetchCourse } = useCourse(courseId || null);
  const { stats } = useCourseStats();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Load course data
  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!course) return;
      
      try {
        setIsLoadingAnalytics(true);
        // Simulate analytics data - in real implementation, this would come from an API
        const mockAnalytics = {
          enrollment: {
            total: course.studentCount,
            thisMonth: Math.floor(course.studentCount * 0.1),
            growth: 15.2
          },
          completion: {
            rate: 78.5,
            averageTime: 12.5, // days
            totalCompletions: Math.floor(course.studentCount * 0.785)
          },
          revenue: {
            total: course.product ? course.studentCount * course.product.price : 0,
            thisMonth: course.product ? Math.floor(course.studentCount * 0.1 * course.product.price) : 0,
            growth: 8.7
          },
          engagement: {
            averageRating: course.rating,
            totalReviews: course.reviewCount,
            completionRate: 78.5,
            averageWatchTime: 65.2 // percentage
          },
          demographics: {
            byAge: [
              { range: '18-24', percentage: 25 },
              { range: '25-34', percentage: 40 },
              { range: '35-44', percentage: 25 },
              { range: '45+', percentage: 10 }
            ],
            byLocation: [
              { country: 'United States', percentage: 35 },
              { country: 'Canada', percentage: 20 },
              { country: 'United Kingdom', percentage: 15 },
              { country: 'Australia', percentage: 10 },
              { country: 'Other', percentage: 20 }
            ]
          },
          timeline: [
            { month: 'Jan', enrollments: 45, completions: 32 },
            { month: 'Feb', enrollments: 52, completions: 38 },
            { month: 'Mar', enrollments: 48, completions: 42 },
            { month: 'Apr', enrollments: 61, completions: 48 },
            { month: 'May', enrollments: 55, completions: 43 },
            { month: 'Jun', enrollments: 67, completions: 52 }
          ]
        };
        
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [course]);

  const formatCurrency = (amount: number) => {
    return formatCurrencyDisplay(amount);
  };

  const formatDuration = (minutes: number) => {
    return courseService.formatDuration(minutes);
  };

  if (courseLoading || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
        <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Course Analytics</h1>
            <p className="text-gray-600">{course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={courseService.getStatusColor(course.status)}>
            {course.status}
          </Badge>
          {course.isPublished && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
              Published
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.enrollment.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.enrollment.growth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completion.rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completion.totalCompletions || 0} students completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.engagement.averageRating || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.engagement.totalReviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.revenue.total || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.revenue.growth || 0}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Course Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Duration</span>
                    <span className="text-sm text-gray-600">{formatDuration(course.totalDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Chapters</span>
                    <span className="text-sm text-gray-600">{course.totalChapters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Watch Time</span>
                    <span className="text-sm text-gray-600">{analytics?.engagement.averageWatchTime || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Completion Time</span>
                    <span className="text-sm text-gray-600">{analytics?.completion.averageTime || 0} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Student Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Completed</span>
                      <span className="text-sm text-gray-600">{analytics?.completion.totalCompletions || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${analytics?.completion.rate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">In Progress</span>
                      <span className="text-sm text-gray-600">
                        {(analytics?.enrollment.total || 0) - (analytics?.completion.totalCompletions || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${100 - (analytics?.completion.rate || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analytics?.enrollment.thisMonth || 0}</div>
                    <div className="text-sm text-blue-600">This Month</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analytics?.enrollment.growth || 0}%</div>
                    <div className="text-sm text-green-600">Growth Rate</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Enrollment data shows consistent growth with {analytics?.enrollment.thisMonth || 0} new students this month.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-2xl font-bold">{analytics?.engagement.averageRating || 0}</span>
                    <span className="text-sm text-gray-600">/ 5.0</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {analytics?.engagement.totalReviews || 0} student reviews
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Watch Time</span>
                    <span className="text-sm text-gray-600">{analytics?.engagement.averageWatchTime || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-gray-600">{analytics?.engagement.completionRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.demographics.byAge.map((ageGroup: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{ageGroup.range}</span>
                        <span className="text-sm text-gray-600">{ageGroup.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${ageGroup.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.demographics.byLocation.map((location: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{location.country}</span>
                        <span className="text-sm text-gray-600">{location.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${location.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseAnalyticsPage;
