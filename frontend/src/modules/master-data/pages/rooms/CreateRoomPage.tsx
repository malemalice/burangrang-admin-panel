import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RoomForm from './RoomForm';

const CreateRoomPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Room"
        subtitle="Add a new room to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/rooms')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RoomForm mode="create" />
      </div>
    </>
  );
};

export default CreateRoomPage;
