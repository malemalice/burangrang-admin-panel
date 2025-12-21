import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import environmentalMeasurementService from '../services/environmentalMeasurementService';
import roomService from '@/modules/master-data/services/roomService';
import {
  EnvironmentalMeasurement,
  CreateEnvironmentalMeasurementDTO,
  UpdateEnvironmentalMeasurementDTO,
} from '../types/environmental-measurement.types';
import { RoomDTO } from '@/modules/master-data/types/master-data.types';

const formSchema = z.object({
  roomId: z.string().min(1, 'Room is required'),
  lighting: z.number().optional(),
  noise: z.number().optional(),
  humidity: z.number().optional(),
  temperature: z.number().optional(),
  remarks: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EnvironmentalMeasurementFormProps {
  measurement?: EnvironmentalMeasurement;
  mode: 'create' | 'edit';
}

const EnvironmentalMeasurementForm = ({ measurement, mode }: EnvironmentalMeasurementFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: '',
      lighting: undefined,
      noise: undefined,
      humidity: undefined,
      temperature: undefined,
      remarks: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        // Fetch rooms for dropdown
        const roomsResponse = await roomService.getRooms({ isActive: true, limit: 100 });
        setRooms(roomsResponse.data);

        // Set form data for edit mode
        if (measurement && mode === 'edit') {
          form.reset({
            roomId: measurement.roomId,
            lighting: measurement.lighting ?? undefined,
            noise: measurement.noise ?? undefined,
            humidity: measurement.humidity ?? undefined,
            temperature: measurement.temperature ?? undefined,
            remarks: measurement.remarks || '',
            date: format(new Date(measurement.date), 'yyyy-MM-dd'),
            isActive: measurement.isActive,
          });
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [measurement, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const measurementData = {
        roomId: data.roomId,
        lighting: data.lighting,
        noise: data.noise,
        humidity: data.humidity,
        temperature: data.temperature,
        remarks: data.remarks || undefined,
        date: new Date(data.date).toISOString(),
        isActive: data.isActive,
      };

      if (mode === 'create') {
        await environmentalMeasurementService.createMeasurement(measurementData as CreateEnvironmentalMeasurementDTO);
        toast.success('Environmental measurement created successfully');
      } else if (measurement) {
        await environmentalMeasurementService.updateMeasurement(measurement.id, measurementData as UpdateEnvironmentalMeasurementDTO);
        toast.success('Environmental measurement updated successfully');
      }
      navigate('/environmental-measurements');
    } catch (error: unknown) {
      console.error('Error saving measurement:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} environmental measurement`;
      toast.error(errorMessage);
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
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Environmental Measurement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} ({room.code})
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Date *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        mode="date"
                        value={field.value}
                        onChange={(value) => field.onChange(value as string)}
                        max={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="lighting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lighting (lux)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 500"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noise (dB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 50"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="humidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Humidity (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 60"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 25"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any remarks or notes"
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
                      Set whether this measurement record is active
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
                onClick={() => navigate('/environmental-measurements')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create Measurement' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalMeasurementForm;
