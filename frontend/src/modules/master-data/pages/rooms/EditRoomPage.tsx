import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RoomForm from './RoomForm';
import roomService from '../../services/roomService';
import { RoomDTO } from '../../types/master-data.types';

const EditRoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await roomService.getRoom(id);
        setRoom(data);
      } catch (error) {
        console.error('Error fetching room:', error);
        toast.error('Failed to load room');
        navigate('/master/rooms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading room details...</span>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Room not found</h2>
        <p className="text-gray-600 mb-4">
          The room you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/rooms')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Room"
        subtitle={`Editing: ${room.name}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/rooms')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RoomForm room={room} mode="edit" />
      </div>
    </>
  );
};

export default EditRoomPage;
