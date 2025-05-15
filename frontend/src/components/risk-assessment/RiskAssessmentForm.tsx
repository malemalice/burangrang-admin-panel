import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, X, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { RiskAssessment, RiskRatingEnum, Department, Threat, HseCategory } from '@/lib/types';
import riskAssessmentService, { CreateRiskAssessmentDTO } from '@/services/riskAssessmentService';
import departmentService from '@/services/departmentService';
import hseCategoryService from '@/services/hseCategoryService';
import threatService from '@/services/threatService';

// Form schema for validation
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  departmentId: z.string().min(1, 'Department is required'),
  assessmentDate: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    mThreatId: z.string().min(1, 'Threat is required'),
    mHseCategoryId: z.string().min(1, 'HSE Category is required'),
    likelihoodLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    consequenceLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    riskMatrixRating: z.string().min(1, 'Risk rating is required'),
  })).min(1, 'At least one risk item is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskAssessmentFormProps {
  assessment?: RiskAssessment;
  mode: 'create' | 'edit';
}

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REVIEWED', label: 'Reviewed' },
];

const levelOptions = [
  { value: '1', label: '1 - Very Low' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Medium' },
  { value: '4', label: '4 - High' },
  { value: '5', label: '5 - Very High' },
];

const RiskAssessmentForm = ({ assessment, mode }: RiskAssessmentFormProps) => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [hseCategories, setHseCategories] = useState<HseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert data to SearchableSelectOption format
  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const threatOptions: SearchableSelectOption[] = threats.map(threat => ({
    value: threat.id,
    label: `${threat.code} - ${threat.name}`
  }));

  const hseCategoryOptions: SearchableSelectOption[] = hseCategories.map(category => ({
    value: category.id,
    label: `${category.code} - ${category.name}`
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      departmentId: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      isActive: true,
      items: [
        {
          mThreatId: '',
          mHseCategoryId: '',
          likelihoodLevel: 1,
          consequenceLevel: 1,
          riskMatrixRating: RiskRatingEnum.LOW,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [departmentsResponse, hseResponse, threatResponse] = await Promise.all([
          departmentService.getAll(),
          hseCategoryService.getAll(),
          threatService.getAll(),
        ]);

        setDepartments(departmentsResponse.data);
        setHseCategories(hseResponse.data);
        setThreats(threatResponse.data);
      } catch (error) {
        toast.error('Failed to load reference data');
      } finally {
        setIsLoading(false);
        setDataReady(true);
      }
    };

    fetchData();
  }, []);

  // Set form values if editing
  useEffect(() => {
    if (assessment && mode === 'edit' && dataReady) {
      form.reset({
        code: assessment.code,
        departmentId: assessment.departmentId,
        assessmentDate: assessment.assessmentDate 
          ? new Date(assessment.assessmentDate).toISOString().split('T')[0]
          : undefined,
        status: assessment.status,
        isActive: assessment.isActive,
        items: assessment.items.map(item => ({
          mThreatId: item.mThreatId,
          mHseCategoryId: item.mHseCategoryId,
          likelihoodLevel: item.likelihoodLevel,
          consequenceLevel: item.consequenceLevel,
          riskMatrixRating: item.riskMatrixRating,
        })),
      });
    }
  }, [assessment, mode, dataReady, form]);

  // Calculate risk rating when likelihood or consequence changes
  const calculateRiskRating = async (index: number) => {
    const likelihoodLevel = form.getValues(`items.${index}.likelihoodLevel`);
    const consequenceLevel = form.getValues(`items.${index}.consequenceLevel`);

    if (!likelihoodLevel || !consequenceLevel) return;

    try {
      const response = await riskAssessmentService.calculateRiskRating(likelihoodLevel, consequenceLevel);
      form.setValue(`items.${index}.riskMatrixRating`, response.riskLevel.description.split(' ')[0].toUpperCase());
    } catch (error) {
      toast.error('Failed to calculate risk rating');
    }
  };

  const handleAddItem = () => {
    append({
      mThreatId: '',
      mHseCategoryId: '',
      likelihoodLevel: 1,
      consequenceLevel: 1,
      riskMatrixRating: RiskRatingEnum.LOW,
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Transform the date if provided
      const assessmentData: CreateRiskAssessmentDTO = {
        ...data,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
        createdBy: 'current-user-id', // This should be replaced with actual user ID
      };

      if (mode === 'create') {
        await riskAssessmentService.create(assessmentData);
        toast.success('Risk assessment created successfully');
      } else if (assessment) {
        await riskAssessmentService.update(assessment.id, assessmentData);
        toast.success('Risk assessment updated successfully');
      }
      navigate('/risk-assessment');
    } catch (error) {
      toast.error(`Failed to ${mode} risk assessment`);
    }
  };

  // Get risk badge color based on rating
  const getRiskBadge = (rating: string) => {
    const colorMap: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800 border-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-800',
      CRITICAL: 'bg-red-100 text-red-800 border-red-800',
      EXTREME: 'bg-purple-100 text-purple-800 border-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorMap[rating] || 'bg-gray-100 text-gray-800 border-gray-800'}`}>
        {rating}
      </span>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Risk Assessment</CardTitle>
        <CardDescription>
          Enter the details for the risk assessment and add risk items below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assessment code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={departmentOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a department"
                        searchPlaceholder="Search department..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
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
            </div>

            <Separator className="my-6" />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Risk Assessment Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="flex items-center justify-center p-6 border rounded-md mb-4 bg-muted/20">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  <p>No risk items added. Click the "Add Item" button to add risk items.</p>
                </div>
              )}

              {fields.length > 0 && (
                <div className="border rounded-md mb-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">HSE Category</TableHead>
                        <TableHead className="w-[250px]">Threat</TableHead>
                        <TableHead className="w-[120px]">Likelihood</TableHead>
                        <TableHead className="w-[120px]">Consequence</TableHead>
                        <TableHead className="w-[120px]">Risk Rating</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.mHseCategoryId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <SearchableSelect
                                      options={hseCategoryOptions}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select HSE category"
                                      searchPlaceholder="Search HSE category..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.mThreatId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <SearchableSelect
                                      options={threatOptions}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select threat"
                                      searchPlaceholder="Search threat..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.likelihoodLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    value={field.value.toString()} 
                                    onValueChange={(value) => {
                                      field.onChange(parseInt(value, 10));
                                      calculateRiskRating(index);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {levelOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.consequenceLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    value={field.value.toString()} 
                                    onValueChange={(value) => {
                                      field.onChange(parseInt(value, 10));
                                      calculateRiskRating(index);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {levelOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.riskMatrixRating`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div>
                                      {field.value && getRiskBadge(field.value)}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/risk-assessment')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentForm; 