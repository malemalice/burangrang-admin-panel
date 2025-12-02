import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { Separator } from '@/core/components/ui/separator';
import { CreateWorkPermitDTO, UpdateWorkPermitDTO, WorkPermit } from '../types/work-permit.types';
import { toast } from 'sonner';

// Form schema for validation
const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  areaId: z.string().min(1, 'Area is required'),
  companyId: z.string().min(1, 'Company is required'),
  proposedStartDate: z.string().min(1, 'Start date is required'),
  proposedEndDate: z.string().min(1, 'End date is required'),
  workStagesDescription: z.string().min(1, 'Work stages description is required'),
  jobSafetyAnalysis: z.string().min(1, 'Job safety analysis is required'),
  workRequirements: z.string().optional(),
  safetyGuideline: z.string().optional(),
  requireCourseVerification: z.boolean().default(false),
  classifications: z
    .array(
      z.object({
        workClassificationId: z.string().min(1, 'Work classification is required'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  employees: z
    .array(
      z.object({
        userId: z.string().optional(),
        employeeName: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  workers: z
    .array(
      z.object({
        guestId: z.string().min(1, 'Guest is required'),
        idNumber: z.string().optional(),
        certificateUrl: z.string().optional(),
        healthDeclarationUrl: z.string().min(1, 'Health declaration URL is required'),
        order: z.number().min(0),
      }),
    )
    .min(1, 'At least one worker is required'),
  heavyEquipment: z
    .array(
      z.object({
        heavyEquipmentId: z.string().min(1, 'Heavy equipment is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  tools: z
    .array(
      z.object({
        toolId: z.string().min(1, 'Tool is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  materials: z
    .array(
      z.object({
        materialId: z.string().min(1, 'Material is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  machines: z
    .array(
      z.object({
        machineId: z.string().min(1, 'Machine is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  professions: z
    .array(
      z.object({
        professionId: z.string().min(1, 'Profession is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        order: z.number().min(0),
      }),
    )
    .optional(),
  requiredCourses: z
    .array(
      z.object({
        courseId: z.string().min(1, 'Course is required'),
        isRequired: z.boolean().default(true),
        order: z.number().min(0),
      }),
    )
    .optional(),
  hazards: z
    .array(
      z.object({
        hazardId: z.string().optional(),
        hazardName: z.string().min(1, 'Hazard name is required'),
        description: z.string().optional(),
        controlMeasure: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string().min(1, 'File URL is required'),
        fileName: z.string().min(1, 'File name is required'),
        fileType: z.string().optional(),
        description: z.string().optional(),
        order: z.number().min(0),
      }),
    )
    .optional(),
  supervisorIds: z.array(z.string()).optional(),
  hseOfficerIds: z.array(z.string()).optional(),
  safetyEquipmentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkPermitFormProps {
  workPermit?: WorkPermit;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateWorkPermitDTO | UpdateWorkPermitDTO) => Promise<void>;
}

const WorkPermitForm = ({ workPermit, mode, onSubmit }: WorkPermitFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [workClassifications, setWorkClassifications] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [heavyEquipment, setHeavyEquipment] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [safetyEquipment, setSafetyEquipment] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      areaId: '',
      companyId: '',
      proposedStartDate: '',
      proposedEndDate: '',
      workStagesDescription: '',
      jobSafetyAnalysis: '',
      workRequirements: '',
      safetyGuideline: '',
      requireCourseVerification: false,
      classifications: [],
      employees: [],
      workers: [
        {
          guestId: '',
          idNumber: '',
          certificateUrl: '',
          healthDeclarationUrl: '',
          order: 0,
        },
      ],
      heavyEquipment: [],
      tools: [],
      materials: [],
      machines: [],
      professions: [],
      requiredCourses: [],
      hazards: [],
      attachments: [],
      supervisorIds: [],
      hseOfficerIds: [],
      safetyEquipmentIds: [],
    },
  });

  const {
    fields: workerFields,
    append: appendWorker,
    remove: removeWorker,
  } = useFieldArray({
    control: form.control,
    name: 'workers',
  });

  const {
    fields: classificationFields,
    append: appendClassification,
    remove: removeClassification,
  } = useFieldArray({
    control: form.control,
    name: 'classifications',
  });

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // TODO: Fetch all master data from respective services
        // For now, using empty arrays - these should be populated from API calls
        setAreas([]);
        setCompanies([]);
        setWorkClassifications([]);
        setGuests([]);
        setUsers([]);
        setHeavyEquipment([]);
        setTools([]);
        setMaterials([]);
        setMachines([]);
        setProfessions([]);
        setCourses([]);
        setSafetyEquipment([]);
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (workPermit && mode === 'edit') {
      form.reset({
        projectName: workPermit.projectName,
        areaId: workPermit.areaId,
        companyId: workPermit.companyId,
        proposedStartDate: workPermit.proposedStartDate.split('T')[0],
        proposedEndDate: workPermit.proposedEndDate.split('T')[0],
        workStagesDescription: workPermit.workStagesDescription,
        jobSafetyAnalysis: workPermit.jobSafetyAnalysis,
        workRequirements: workPermit.workRequirements || '',
        safetyGuideline: workPermit.safetyGuideline || '',
        requireCourseVerification: workPermit.requireCourseVerification,
        classifications:
          workPermit.classifications?.map((c) => ({
            workClassificationId: c.workClassificationId || c.id,
            order: c.order,
          })) || [],
        employees:
          workPermit.employees?.map((e) => ({
            userId: e.userId,
            employeeName: e.employeeName,
            order: e.order,
          })) || [],
        workers:
          workPermit.workers?.map((w) => ({
            guestId: w.guestId,
            idNumber: w.idNumber || '',
            certificateUrl: w.certificateUrl || '',
            healthDeclarationUrl: w.healthDeclarationUrl,
            order: w.order,
          })) || [
            {
              guestId: '',
              idNumber: '',
              certificateUrl: '',
              healthDeclarationUrl: '',
              order: 0,
            },
          ],
        heavyEquipment:
          workPermit.heavyEquipment?.map((e) => ({
            heavyEquipmentId: e.heavyEquipmentId,
            quantity: e.quantity,
            order: e.order,
          })) || [],
        tools:
          workPermit.tools?.map((t) => ({
            toolId: t.toolId,
            quantity: t.quantity,
            order: t.order,
          })) || [],
        materials:
          workPermit.materials?.map((m) => ({
            materialId: m.materialId,
            quantity: m.quantity,
            order: m.order,
          })) || [],
        machines:
          workPermit.machines?.map((m) => ({
            machineId: m.machineId,
            quantity: m.quantity,
            order: m.order,
          })) || [],
        professions:
          workPermit.professions?.map((p) => ({
            professionId: p.professionId,
            quantity: p.quantity,
            order: p.order,
          })) || [],
        requiredCourses:
          workPermit.requiredCourses?.map((c) => ({
            courseId: c.courseId,
            isRequired: c.isRequired,
            order: c.order,
          })) || [],
        hazards:
          workPermit.hazards?.map((h) => ({
            hazardId: h.hazardId,
            hazardName: h.hazardName,
            description: h.description || '',
            controlMeasure: h.controlMeasure || '',
            order: h.order,
          })) || [],
        attachments:
          workPermit.attachments?.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType || '',
            description: a.description || '',
            order: a.order,
          })) || [],
        supervisorIds: workPermit.supervisors?.map((s) => s.guestId) || [],
        hseOfficerIds: workPermit.hseOfficers?.map((h) => h.userId) || [],
        safetyEquipmentIds: workPermit.safetyEquipment?.map((s) => s.safetyEquipmentId) || [],
      });
    }
  }, [workPermit, mode, form]);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Validate dates
      const startDate = new Date(data.proposedStartDate);
      const endDate = new Date(data.proposedEndDate);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(data as CreateWorkPermitDTO);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Section 1: Identitas Permit */}
        <Card>
          <CardHeader>
            <CardTitle>Identitas Permit</CardTitle>
            <CardDescription>Basic permit information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proposedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Proyek & Pekerjaan */}
        <Card>
          <CardHeader>
            <CardTitle>Proyek & Pekerjaan</CardTitle>
            <CardDescription>Project and work details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="workStagesDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Stages Description *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe work stages..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobSafetyAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Safety Analysis *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Job safety analysis..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Requirements</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Work requirements..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="safetyGuideline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safety Guideline</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Safety guidelines..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <FormLabel>Work Classifications</FormLabel>
              {classificationFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`classifications.${index}.workClassificationId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {workClassifications.map((wc) => (
                                <SelectItem key={wc.id} value={wc.id}>
                                  {wc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeClassification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendClassification({ workClassificationId: '', order: classificationFields.length })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Classification
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Workers */}
        <Card>
          <CardHeader>
            <CardTitle>Workers</CardTitle>
            <CardDescription>List of workers assigned to this permit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workerFields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Worker {index + 1}</h4>
                    {workerFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWorker(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name={`workers.${index}.guestId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Worker *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select worker" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {guests.map((guest) => (
                              <SelectItem key={guest.id} value={guest.id}>
                                {guest.name}
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
                    name={`workers.${index}.idNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Worker ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`workers.${index}.certificateUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Certificate URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`workers.${index}.healthDeclarationUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Declaration URL *</FormLabel>
                        <FormControl>
                          <Input placeholder="Health declaration URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendWorker({
                  guestId: '',
                  idNumber: '',
                  certificateUrl: '',
                  healthDeclarationUrl: '',
                  order: workerFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Worker
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Course Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Course Verification</CardTitle>
            <CardDescription>Require course verification for workers</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="requireCourseVerification"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Require Course Verification</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Require workers/employees to complete required courses
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Work Permit' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WorkPermitForm;
