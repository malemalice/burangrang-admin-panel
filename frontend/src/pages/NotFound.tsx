
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-9xl font-bold text-admin-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Page not found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Home size={18} /> Return to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft size={18} /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
