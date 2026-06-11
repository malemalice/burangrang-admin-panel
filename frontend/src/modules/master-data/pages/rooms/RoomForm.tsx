import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import roomService from '../../services/roomService';
import { CreateRoomDTO, UpdateRoomDTO, RoomDTO, AreaDTO } from '../../types/master-data.types';

const formSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  code: z.string().min(1, 'Room code is required'),
  description: z.string().optional(),
  areaId: z.string().min(1, 'Area is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RoomFormProps {
  room?: RoomDTO;
  mode: 'create' | 'edit';
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(', ');
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

const RoomForm = ({ room, mode }: RoomFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [areas, setAreas] = useState<AreaDTO[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      areaId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch available areas (those without rooms)
        const areasResponse = await roomService.getAreas({ isActive: true, hasRoom: false, options: true });
        let availableAreas = areasResponse.data;

        // Set form data for edit mode
        if (room && mode === 'edit') {
          // In edit mode, the current area is occupied by THIS room, so it excluded from hasRoom=false list.
          // We need to fetch it and add it to the list if not present.
          if (room.areaId && !availableAreas.find(a => a.id === room.areaId)) {
            try {
              const currentArea = await roomService.getArea(room.areaId);
              availableAreas = [currentArea, ...availableAreas];
            } catch (error) {
              console.error('Error fetching current area:', error);
            }
          }

          form.reset({
            name: room.name,
            code: room.code,
            description: room.description || '',
            areaId: room.areaId,
            isActive: room.isActive,
          });
        }
        
        setAreas(availableAreas);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [room, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      if (mode === 'create') {
        const roomData: CreateRoomDTO = {
          name: data.name,
          code: data.code,
          description: data.description || undefined,
          areaId: data.areaId,
          isActive: data.isActive,
        };
        await roomService.createRoom(roomData);
        toast.success('Room created successfully');
      } else if (room) {
        const roomData: UpdateRoomDTO = {
          name: data.name,
          code: data.code,
          description: data.description || undefined,
          areaId: data.areaId,
          isActive: data.isActive,
        };
        await roomService.updateRoom(room.id, roomData);
        toast.success('Room updated successfully');
      }
      navigate('/master/rooms');
    } catch (error: unknown) {
      console.error('Error saving room:', error);
      toast.error(getApiErrorMessage(error, `Failed to ${mode} room`));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter room name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter room code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name} ({area.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter room description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-gray-500">
                      Set whether this room is active
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/rooms')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create Room' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RoomForm;
