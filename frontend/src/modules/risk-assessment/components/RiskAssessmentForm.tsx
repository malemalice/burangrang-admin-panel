import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, X, AlertTriangle } from 'lucide-react';

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
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { Editor } from '@/core/components/ui/editor';

import { RiskAssessment, RiskRatingEnum, Department, Threat, HseCategory, User } from '@/core/lib/types';
import riskAssessmentService, { type CreateRiskAssessmentDTO } from '../services/riskAssessmentService';
import { departmentService, hseCategoryService, threatService } from '@/modules/master-data';
import { userService } from '@/modules/users';

// Form schema for validation
const formSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  assessmentDate: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    mThreatId: z.string().min(1, 'Threat is required'),
    mHseCategoryId: z.string().min(1, 'HSE Category is required'),
    riskDescription: z.string().min(1, 'Risk description is required'),
    likelihoodLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    consequenceLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    riskMatrixRating: z.string().min(1, 'Risk rating is required'),
    interpretation: z.string().min(1, 'Interpretation is required'),
    postLikelihoodLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    postConsequenceLevel: z.coerce.number().min(1, 'Minimum level is 1').max(5, 'Maximum level is 5'),
    postRiskMatrixRating: z.string().min(1, 'Post risk rating is required'),
    postInterpretation: z.string().min(1, 'Post interpretation is required'),
  })).min(1, 'At least one risk item is required'),
  assigneeId: z.string().optional(),
  actionPlan: z.string().optional(),
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

interface RiskMatrixEntry {
  id: string;
  likelihoodLevel: number;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: string; // A, B, C, D, E, etc. (dynamic)
  consequenceName: string;
  consequenceDesc: string;
  risk_rating: string;
  isActive: boolean;
}

const RiskAssessmentForm = ({ assessment, mode }: RiskAssessmentFormProps) => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [hseCategories, setHseCategories] = useState<HseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [riskMatrixData, setRiskMatrixData] = useState<RiskMatrixEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Convert data to SearchableSelectOption format
  const departmentOptions: SearchableSelectOption[] = departments.map(dept => ({
    value: dept.id,
    label: dept.name
  }));

  const threatOptions: SearchableSelectOption[] = threats.map(threat => ({
    value: threat.id,
    label: `${threat.name} - ${threat.description}`
  }));

  const hseCategoryOptions: SearchableSelectOption[] = hseCategories.map(category => ({
    value: category.id,
    label: `${category.name}`
  }));

  const userOptions: SearchableSelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`
  }));

  // Generate likelihood level options from risk matrix data
  const likelihoodOptions = useMemo(() => {
    if (!riskMatrixData || riskMatrixData.length === 0) return [];
    
    // Get unique likelihood levels, sorted by level, only active entries
    const uniqueLikelihoods = Array.from(
      new Map(
        riskMatrixData
          .filter(entry => entry.isActive)
          .map(entry => [
            entry.likelihoodLevel,
            {
              level: entry.likelihoodLevel,
              name: entry.likelihoodName,
              desc: entry.likelihoodDesc,
            }
          ])
      ).values()
    ).sort((a, b) => a.level - b.level);

    return uniqueLikelihoods.map(likelihood => ({
      value: likelihood.level.toString(),
      label: `${likelihood.level} - ${likelihood.name}`,
      description: likelihood.desc,
    }));
  }, [riskMatrixData]);

  // Generate consequence level options from risk matrix data, sorted alphabetically
  const consequenceOptions = useMemo(() => {
    if (!riskMatrixData || riskMatrixData.length === 0) return [];
    
    // Get unique consequence levels, sorted alphabetically (A, B, C, D, E, etc.), only active entries
    const uniqueConsequences = Array.from(
      new Map(
        riskMatrixData
          .filter(entry => entry.isActive)
          .map(entry => [
            entry.consequenceLevel,
            {
              level: entry.consequenceLevel,
              name: entry.consequenceName,
              desc: entry.consequenceDesc,
            }
          ])
      ).values()
    ).sort((a, b) => a.level.localeCompare(b.level)); // Sort alphabetically

    // Map consequence letters to numbers (A=1, B=2, C=3, D=4, E=5, etc.)
    return uniqueConsequences.map((consequence, index) => ({
      value: (index + 1).toString(), // Use index+1 as the numeric value (1, 2, 3, 4, 5, etc.)
      label: `${consequence.level} - ${consequence.name}`,
      description: consequence.desc,
      letter: consequence.level, // Store the letter for mapping
    }));
  }, [riskMatrixData]);

  // Create mapping from consequence number (1-N) to letter (A-Z)
  const consequenceNumberToLetter = useMemo(() => {
    const mapping: Record<number, string> = {};
    consequenceOptions.forEach((option, index) => {
      mapping[index + 1] = option.letter;
    });
    return mapping;
  }, [consequenceOptions]);

  // Create mapping from consequence letter (A-Z) to number (1-N)
  const consequenceLetterToNumber = useMemo(() => {
    const mapping: Record<string, number> = {};
    consequenceOptions.forEach((option, index) => {
      mapping[option.letter] = index + 1;
    });
    return mapping;
  }, [consequenceOptions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      description: '',
      departmentId: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      isActive: true,
      items: [
        {
          mThreatId: '',
          mHseCategoryId: '',
          riskDescription: '',
          likelihoodLevel: 1,
          consequenceLevel: 1,
          riskMatrixRating: RiskRatingEnum.LOW,
          interpretation: RiskRatingEnum.LOW,
          postLikelihoodLevel: 1,
          postConsequenceLevel: 1,
          postRiskMatrixRating: RiskRatingEnum.LOW,
          postInterpretation: RiskRatingEnum.LOW,
        },
      ],
      assigneeId: '',
      actionPlan: '',
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
        const [departmentsResponse, hseResponse, threatResponse, usersResponse, riskMatrixResponse] = await Promise.all([
          departmentService.getDepartments({ page: 1, limit: 1000 }),
          hseCategoryService.getAll(),
          threatService.getAll(),
          userService.getAll({ page: 1, limit: 1000 }),
          riskAssessmentService.getRiskMatrixEntries(),
        ]);

        setDepartments(departmentsResponse.data);
        setHseCategories(hseResponse.data);
        setThreats(threatResponse.data);
        setUsers(usersResponse.data);
        setRiskMatrixData(riskMatrixResponse.data);
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
        description: assessment.description || '',
        departmentId: assessment.departmentId,
        assessmentDate: assessment.assessmentDate
          ? new Date(assessment.assessmentDate).toISOString().split('T')[0]
          : undefined,
        status: assessment.status,
        isActive: assessment.isActive,
        items: assessment.items.map(item => ({
          mThreatId: item.mThreatId,
          mHseCategoryId: item.mHseCategoryId,
          riskDescription: item.riskDescription || '',
          likelihoodLevel: item.likelihoodLevel,
          consequenceLevel: item.consequenceLevel,
          riskMatrixRating: item.riskMatrixRating,
          interpretation: item.interpretation || RiskRatingEnum.LOW,
          postLikelihoodLevel: item.postLikelihoodLevel || item.likelihoodLevel,
          postConsequenceLevel: item.postConsequenceLevel || item.consequenceLevel,
          postRiskMatrixRating: item.postRiskMatrixRating || item.riskMatrixRating,
          postInterpretation: item.postInterpretation || item.interpretation || RiskRatingEnum.LOW,
        })),
        assigneeId: assessment.assigneeId,
        actionPlan: assessment.actionPlan,
      });
    }
  }, [assessment, mode, dataReady, form]);

  // Calculate risk rating when likelihood or consequence changes
  const calculateRiskRating = async (index: number, isPostControl = false) => {
    const likelihoodLevel = form.getValues(`items.${index}.${isPostControl ? 'postLikelihoodLevel' : 'likelihoodLevel'}`);
    const consequenceLevel = form.getValues(`items.${index}.${isPostControl ? 'postConsequenceLevel' : 'consequenceLevel'}`);

    if (!likelihoodLevel || !consequenceLevel) return;

    // Convert consequence level number (1-N) to uppercase letter (A-Z) using dynamic mapping
    const consequenceLetter = consequenceNumberToLetter[consequenceLevel];
    if (!consequenceLetter) {
      toast.error('Invalid consequence level');
      return;
    }

    try {
      const response = await riskAssessmentService.calculateRiskRating(likelihoodLevel, consequenceLetter.toUpperCase());
      const rating = response.riskLevel.description.split(' ')[0].toUpperCase();
      const interpretation = response.interpretation || rating;
      
      if (isPostControl) {
        form.setValue(`items.${index}.postRiskMatrixRating`, rating);
        form.setValue(`items.${index}.postInterpretation`, interpretation);
      } else {
        form.setValue(`items.${index}.riskMatrixRating`, rating);
        form.setValue(`items.${index}.interpretation`, interpretation);
      }
    } catch (error) {
      toast.error('Failed to calculate risk rating');
    }
  };

  const handleAddItem = () => {
    append({
      mThreatId: '',
      mHseCategoryId: '',
      riskDescription: '',
      likelihoodLevel: 1,
      consequenceLevel: 1,
      riskMatrixRating: RiskRatingEnum.LOW,
      interpretation: RiskRatingEnum.LOW,
      postLikelihoodLevel: 1,
      postConsequenceLevel: 1,
      postRiskMatrixRating: RiskRatingEnum.LOW,
      postInterpretation: RiskRatingEnum.LOW,
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Transform the date if provided
      // Form validation ensures required fields are present
      const assessmentData: CreateRiskAssessmentDTO = {
        code: data.code as string,
        description: data.description,
        departmentId: data.departmentId as string,
        status: data.status as string,
        items: data.items.map(item => ({
          mThreatId: item.mThreatId as string,
          mHseCategoryId: item.mHseCategoryId as string,
          riskDescription: item.riskDescription as string,
          likelihoodLevel: item.likelihoodLevel as number,
          consequenceLevel: item.consequenceLevel as number,
          riskMatrixRating: item.riskMatrixRating as string,
          interpretation: item.interpretation as string,
          postLikelihoodLevel: item.postLikelihoodLevel as number,
          postConsequenceLevel: item.postConsequenceLevel as number,
          postRiskMatrixRating: item.postRiskMatrixRating as string,
          postInterpretation: item.postInterpretation as string,
        })),
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
        createdBy: 'current-user-id', // This should be replaced with actual user ID
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.assigneeId && { assigneeId: data.assigneeId }),
        ...(data.actionPlan && { actionPlan: data.actionPlan }),
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

  // Get risk rating code from backend risk matrix data
  const getRiskRatingCode = (consequenceLevel: number, likelihoodLevel: number): string => {
    if (!riskMatrixData || riskMatrixData.length === 0 || !consequenceNumberToLetter) return '';
    
    // Convert consequence level number (1-N) to letter code (A-Z) using dynamic mapping
    const consequenceCode = consequenceNumberToLetter[consequenceLevel];
    if (!consequenceCode) return '';
    
    // Find matching entry in risk matrix
    const matrixEntry = riskMatrixData.find(
      (entry) => entry.likelihoodLevel === likelihoodLevel && entry.consequenceLevel === consequenceCode
    );
    
    if (!matrixEntry) return `${consequenceCode}${likelihoodLevel}`;
    
    return `${matrixEntry.consequenceLevel}${matrixEntry.likelihoodLevel}`;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assessment Code <span className="text-destructive">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Department <span className="text-destructive">*</span>
                      </FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter assessment description" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assessmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Date</FormLabel>
                      <FormControl>
                        <DateTimePicker mode="date" {...field} />
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
                      <FormLabel>
                        Status <span className="text-destructive">*</span>
                      </FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={userOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select an assignee"
                          searchPlaceholder="Search user..."
                          includeNone
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
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
            </div>

            <Separator />

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
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Risk Item {index + 1}</CardTitle>
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
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name={`items.${index}.mHseCategoryId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  HSE Category <span className="text-destructive">*</span>
                                </FormLabel>
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
                          <FormField
                            control={form.control}
                            name={`items.${index}.mThreatId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Threat <span className="text-destructive">*</span>
                                </FormLabel>
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
                        </div>

                        <FormField
                          control={form.control}
                          name={`items.${index}.riskDescription`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Risk Description <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter risk description" 
                                  rows={2}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <FormField
                            control={form.control}
                            name={`items.${index}.likelihoodLevel`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Likelihood <span className="text-destructive">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value.toString()}
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value, 10));
                                    calculateRiskRating(index, false);
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {likelihoodOptions.map((option) => (
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
                            name={`items.${index}.consequenceLevel`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Consequence <span className="text-destructive">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value.toString()}
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value, 10));
                                    calculateRiskRating(index, false);
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {consequenceOptions.map((option) => (
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
                            name={`items.${index}.riskMatrixRating`}
                            render={({ field }) => {
                              const consequenceLevel = form.watch(`items.${index}.consequenceLevel`);
                              const likelihoodLevel = form.watch(`items.${index}.likelihoodLevel`);
                              const riskCode = getRiskRatingCode(consequenceLevel, likelihoodLevel);
                              
                              return (
                                <FormItem>
                                  <FormLabel>Risk Rating</FormLabel>
                                  <FormControl>
                                    <div className="pt-2">
                                      {riskCode && (
                                        <span className="px-2 py-1 rounded-md text-xs font-medium border bg-gray-100 text-gray-800 border-gray-800">
                                          {riskCode}
                                        </span>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.interpretation`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interpretation</FormLabel>
                                <FormControl>
                                  <div className="pt-2">
                                    {field.value && getRiskBadge(field.value)}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-3">Post-Control Assessment</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <FormField
                              control={form.control}
                              name={`items.${index}.postLikelihoodLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Post Likelihood <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) => {
                                      field.onChange(parseInt(value, 10));
                                      calculateRiskRating(index, true);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {likelihoodOptions.map((option) => (
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
                              name={`items.${index}.postConsequenceLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Post Consequence <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) => {
                                      field.onChange(parseInt(value, 10));
                                      calculateRiskRating(index, true);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {consequenceOptions.map((option) => (
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
                              name={`items.${index}.postRiskMatrixRating`}
                              render={({ field }) => {
                                const postConsequenceLevel = form.watch(`items.${index}.postConsequenceLevel`);
                                const postLikelihoodLevel = form.watch(`items.${index}.postLikelihoodLevel`);
                                const postRiskCode = getRiskRatingCode(postConsequenceLevel, postLikelihoodLevel);
                                
                                return (
                                  <FormItem>
                                    <FormLabel>Post Risk Rating</FormLabel>
                                    <FormControl>
                                      <div className="pt-2">
                                        {postRiskCode && (
                                          <span className="px-2 py-1 rounded-md text-xs font-medium border bg-gray-100 text-gray-800 border-gray-800">
                                            {postRiskCode}
                                          </span>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.postInterpretation`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Post Interpretation</FormLabel>
                                  <FormControl>
                                    <div className="pt-2">
                                      {field.value && getRiskBadge(field.value)}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Action Plan</h3>
              <FormField
                control={form.control}
                name="actionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Editor
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

