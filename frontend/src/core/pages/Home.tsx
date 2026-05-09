import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { useAuth } from '@/core/lib/auth';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const Home = () => {
  const { user } = useAuth();
  const displayName = user?.firstName?.trim() ? user.firstName : user?.email ?? 'there';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getTimeBasedGreeting()}, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your dashboard. Use the sidebar to navigate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Quick access
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/users">Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/roles">Roles</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
