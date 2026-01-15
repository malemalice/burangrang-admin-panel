import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { SearchableSelect, SearchableSelectOption } from '@/core/components/ui/searchable-select';
import { ModalCombobox, ModalComboboxOption } from '@/core/components/ui/modal-combobox';
import { Textarea } from '@/core/components/ui/textarea';

import { RiskRatingEnum, Risk, RiskCategory } from '@/core/lib/types';
import riskAssessmentService, { type CreateRiskAssessmentItemDTO } from '../services/riskAssessmentService';
import riskMitigationService, { type RiskMitigation } from '../services/riskMitigationService';
import { riskCategoryService, riskService } from '@/modules/master-data';
import { createRiskCategoryFromQuery } from '@/modules/master-data/pages/risk-categories';
import { createRiskFromQuery } from '@/modules/master-data/pages/risks';

// Mitigation schema for validation
const mitigationSchema = z.object({
  eliminate: z.string().optional(),
  transfer: z.string().optional(),
  reduce: z.string().optional(),
  accept: z.string().optional(),
});

// Form schema for validation - single item
const formSchema = z.object({
  mRiskId: z.string().min(1, 'Risk is required'),
  mRiskCategoryId: z.string().min(1, 'Risk Category is required'),
  likelihoodLevel: z.string().min(1, 'Likelihood level is required'),
  consequenceLevel: z.coerce.number({ required_error: 'Consequence level is required', invalid_type_error: 'Consequence level is required' }),
  riskMatrixRating: z.string().min(1, 'Risk rating is required'),
  interpretation: z.string().min(1, 'Interpretation is required'),
  postLikelihoodLevel: z.string().min(1, 'Post likelihood level is required'),
  postConsequenceLevel: z.coerce.number({ required_error: 'Post consequence level is required', invalid_type_error: 'Post consequence level is required' }),
  postRiskMatrixRating: z.string().min(1, 'Post risk rating is required'),
  postInterpretation: z.string().min(1, 'Post interpretation is required'),
  mitigation: mitigationSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskAssessmentItemFormProps {
  assessmentId?: string;
  initialItem?: Partial<CreateRiskAssessmentItemDTO>;
  onSubmit?: (item: CreateRiskAssessmentItemDTO) => void;
  onCancel?: () => void;
  showCard?: boolean; // Optional: whether to show Card wrapper (default: true)
}

interface RiskMatrixEntry {
  id: string;
  likelihoodLevel: string; // Stored as String in DB (A, B, C, D, E, etc.)
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: number; // Stored as Int in DB (1, 2, 3, 4, 5, etc.)
  consequenceName: string;
  consequenceDesc: string;
  risk_rating: string;
  isActive: boolean;
}

const RiskAssessmentItemForm = ({ assessmentId, initialItem, onSubmit, onCancel, showCard = true }: RiskAssessmentItemFormProps) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [riskMatrixData, setRiskMatrixData] = useState<RiskMatrixEntry[]>([]);
  const [riskMitigations, setRiskMitigations] = useState<RiskMitigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);
  const [isLoadingRiskMitigations, setIsLoadingRiskMitigations] = useState(false);
  const isInitialMount = useRef(true);
  const previousRiskId = useRef<string | undefined>(undefined);

  // Convert data to SearchableSelectOption format (use SearchableSelect outside modal, ModalCombobox inside modal)
  const riskOptions: ModalComboboxOption[] = risks.map(risk => ({
    value: risk.id,
    label: `${risk.name} - ${risk.description}`
  }));

  const riskCategoryOptions: ModalComboboxOption[] = riskCategories.map(category => ({
    value: category.id,
    label: `${category.name}`
  }));

  // Generate likelihood level options from risk matrix data
  // Likelihood is stored as alphabet (A, B, C, D, E, etc.) in database
  const likelihoodOptions = useMemo(() => {
    if (!riskMatrixData || riskMatrixData.length === 0) return [];
    
    // Get unique likelihood levels, sorted alphabetically, only active entries
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
    ).sort((a, b) => a.level.localeCompare(b.level)); // Sort alphabetically

    return uniqueLikelihoods.map(likelihood => ({
      value: likelihood.level, // Store as string (A, B, C, etc.)
      label: `${likelihood.level} - ${likelihood.name}`,
      description: likelihood.desc,
    }));
  }, [riskMatrixData]);

  // Generate consequence level options from risk matrix data
  // Consequence is stored as numeric (1, 2, 3, 4, 5, etc.) in database
  const consequenceOptions = useMemo(() => {
    if (!riskMatrixData || riskMatrixData.length === 0) return [];
    
    // Get unique consequence levels, sorted numerically, only active entries
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
    ).sort((a, b) => a.level - b.level); // Sort numerically

    return uniqueConsequences.map(consequence => ({
      value: consequence.level.toString(), // Store as string representation of number
      label: `${consequence.level} - ${consequence.name}`,
      description: consequence.desc,
      numericValue: consequence.level,
    }));
  }, [riskMatrixData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mRiskId: initialItem?.mRiskId || '',
      mRiskCategoryId: initialItem?.mRiskCategoryId || '',
      likelihoodLevel: initialItem?.likelihoodLevel || 'A',
      consequenceLevel: initialItem?.consequenceLevel || 1,
      riskMatrixRating: initialItem?.riskMatrixRating || '',
      interpretation: initialItem?.interpretation || RiskRatingEnum.LOW,
      postLikelihoodLevel: initialItem?.postLikelihoodLevel || initialItem?.likelihoodLevel || 'A',
      postConsequenceLevel: initialItem?.postConsequenceLevel || initialItem?.consequenceLevel || 1,
      postRiskMatrixRating: initialItem?.postRiskMatrixRating || initialItem?.riskMatrixRating || '',
      postInterpretation: initialItem?.postInterpretation || initialItem?.interpretation || RiskRatingEnum.LOW,
      mitigation: initialItem?.mitigation || {
        eliminate: '',
        transfer: '',
        reduce: '',
        accept: '',
      },
    },
  });

  // Reset form when initialItem changes (for edit mode)
  useEffect(() => {
    if (initialItem) {
      form.reset({
        mRiskId: initialItem.mRiskId || '',
        mRiskCategoryId: initialItem.mRiskCategoryId || '',
        likelihoodLevel: initialItem.likelihoodLevel || 'A',
        consequenceLevel: initialItem.consequenceLevel || 1,
        riskMatrixRating: initialItem.riskMatrixRating || '',
        interpretation: initialItem.interpretation || RiskRatingEnum.LOW,
        postLikelihoodLevel: initialItem.postLikelihoodLevel || initialItem.likelihoodLevel || 'A',
        postConsequenceLevel: initialItem.postConsequenceLevel || initialItem.consequenceLevel || 1,
        postRiskMatrixRating: initialItem.postRiskMatrixRating || initialItem.riskMatrixRating || '',
        postInterpretation: initialItem.postInterpretation || initialItem.interpretation || RiskRatingEnum.LOW,
        mitigation: initialItem.mitigation || {
          eliminate: '',
          transfer: '',
          reduce: '',
          accept: '',
        },
      });
      // Reset initial mount flag when switching items
      isInitialMount.current = true;
      previousRiskId.current = initialItem.mRiskId || undefined;
    }
  }, [initialItem, form]);

  // Fetch risk matrix data (only this is needed upfront)
  useEffect(() => {
    const fetchRiskMatrix = async () => {
      setIsLoading(true);
      try {
        const riskMatrixResponse = await riskAssessmentService.getRiskMatrixEntries();
        setRiskMatrixData(riskMatrixResponse.data);
      } catch (error) {
        toast.error('Failed to load risk matrix data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskMatrix();
  }, []);

  // Load initial risk and risk category when editing
  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialItem) return;

      const riskId = initialItem.mRiskId;
      const riskCategoryId = initialItem.mRiskCategoryId;

      // Load risk category if provided
      if (riskCategoryId) {
        try {
          setIsLoadingRiskCategories(true);
          const category = await riskCategoryService.getById(riskCategoryId);
          setRiskCategories(prev => {
            const exists = prev.some(cat => cat.id === category.id);
            if (exists) return prev;
            return [category, ...prev];
          });
        } catch (error) {
          console.error('Failed to load risk category:', error);
        } finally {
          setIsLoadingRiskCategories(false);
        }
      }

      // Load risk if provided
      if (riskId) {
        try {
          setIsLoadingRisks(true);
          const risk = await riskService.getById(riskId);
          setRisks(prev => {
            const exists = prev.some(r => r.id === risk.id);
            if (exists) return prev;
            return [risk, ...prev];
          });
          
          // If risk category is not set but risk has one, set it
          if (risk.riskCategoryId && !riskCategoryId) {
            form.setValue('mRiskCategoryId', risk.riskCategoryId);
            // Also load the risk category
            try {
              const category = await riskCategoryService.getById(risk.riskCategoryId);
              setRiskCategories(prev => {
                const exists = prev.some(cat => cat.id === category.id);
                if (exists) return prev;
                return [category, ...prev];
              });
            } catch (error) {
              console.error('Failed to load risk category from risk:', error);
            }
          }
        } catch (error) {
          console.error('Failed to load risk:', error);
        } finally {
          setIsLoadingRisks(false);
        }
      }
    };

    loadInitialData();
  }, [initialItem, form]);

  // Helper to ensure selected item is in the list
  const ensureSelectedItemInList = useCallback(async <T extends { id: string }>(
    items: T[],
    selectedId: string | undefined,
    getById: (id: string) => Promise<T>
  ): Promise<T[]> => {
    if (!selectedId) return items;
    
    const existingIds = new Set(items.map(item => item.id));
    if (existingIds.has(selectedId)) return items;
    
    try {
      const selectedItem = await getById(selectedId);
      return [selectedItem, ...items.filter(item => item.id !== selectedId)];
    } catch {
      return items;
    }
  }, []);

  // Search risk categories handler
  const handleSearchRiskCategories = useCallback(async (searchQuery: string) => {
    setIsLoadingRiskCategories(true);
    try {
      const query = searchQuery.trim();
      const limit = query ? 20 : 5; // Show more results when searching
      
      const response = await riskCategoryService.getAll({
        page: 1,
        limit,
        isActive: true,
        search: query || undefined,
      });
      
      // Ensure selected item is included if it exists
      const selectedId = form.getValues('mRiskCategoryId');
      const categoriesWithSelected = await ensureSelectedItemInList(
        response.data,
        selectedId,
        riskCategoryService.getById
      );
      
      setRiskCategories(categoriesWithSelected);
    } catch (error) {
      toast.error('Failed to search risk categories');
    } finally {
      setIsLoadingRiskCategories(false);
    }
  }, [form, ensureSelectedItemInList]);

  // Create new risk category handler
  const handleCreateNewRiskCategory = useCallback(async (searchQuery: string): Promise<string> => {
    return createRiskCategoryFromQuery(searchQuery, (newCategory) => {
      // Add to the list and select it
      setRiskCategories(prev => [newCategory, ...prev]);
      form.setValue('mRiskCategoryId', newCategory.id);
    });
  }, [form]);

  // Search risks handler
  const handleSearchRisks = useCallback(async (searchQuery: string) => {
    setIsLoadingRisks(true);
    try {
      const query = searchQuery.trim();
      const limit = query ? 20 : 5; // Show more results when searching
      
      const response = await riskService.getAll({
        page: 1,
        limit,
        isActive: true,
        search: query || undefined,
      });
      
      // Ensure selected item is included if it exists
      const selectedId = form.getValues('mRiskId');
      const risksWithSelected = await ensureSelectedItemInList(
        response.data,
        selectedId,
        riskService.getById
      );
      
      setRisks(risksWithSelected);
    } catch (error) {
      toast.error('Failed to search risks');
    } finally {
      setIsLoadingRisks(false);
    }
  }, [form, ensureSelectedItemInList]);

  // Watch form values for risk rating code calculation
  const likelihoodLevel = form.watch('likelihoodLevel');
  const consequenceLevel = form.watch('consequenceLevel');
  const postLikelihoodLevel = form.watch('postLikelihoodLevel');
  const postConsequenceLevel = form.watch('postConsequenceLevel');
  const selectedRiskId = form.watch('mRiskId');

  // Sync risk category when risk is selected (only when user changes risk, not on initial load)
  useEffect(() => {
    // Skip on initial mount or if risk hasn't actually changed
    if (isInitialMount.current || previousRiskId.current === selectedRiskId) {
      if (selectedRiskId) {
        previousRiskId.current = selectedRiskId;
      }
      return;
    }

    const syncRiskCategory = async () => {
      if (!selectedRiskId) {
        previousRiskId.current = undefined;
        return;
      }

      const selectedRisk = risks.find(r => r.id === selectedRiskId);
      if (selectedRisk && selectedRisk.riskCategoryId) {
        const currentCategoryId = form.getValues('mRiskCategoryId');
        // Only update if different
        if (currentCategoryId !== selectedRisk.riskCategoryId) {
          form.setValue('mRiskCategoryId', selectedRisk.riskCategoryId);
          
          // Ensure the risk category is in the list
          try {
            const category = await riskCategoryService.getById(selectedRisk.riskCategoryId);
            setRiskCategories(prev => {
              const exists = prev.some(cat => cat.id === category.id);
              if (exists) return prev;
              return [category, ...prev];
            });
          } catch (error) {
            console.error('Failed to load risk category:', error);
          }
        }
      }
      
      previousRiskId.current = selectedRiskId;
    };

    syncRiskCategory();
  }, [selectedRiskId, risks, form]);

  // Mark initial mount as complete after initial data is loaded
  useEffect(() => {
    if (!isLoading && risks.length > 0 && riskCategories.length > 0) {
      isInitialMount.current = false;
      if (selectedRiskId) {
        previousRiskId.current = selectedRiskId;
      }
    }
  }, [isLoading, risks.length, riskCategories.length, selectedRiskId]);

  // Create new risk handler
  const handleCreateNewRisk = useCallback(async (searchQuery: string): Promise<string> => {
    // Get the selected risk category ID
    const riskCategoryId = form.getValues('mRiskCategoryId');
    if (!riskCategoryId) {
      toast.error('Please select a risk category first');
      throw new Error('Risk category is required');
    }

    return createRiskFromQuery(searchQuery, riskCategoryId, (newRisk) => {
      // Add to the list and select it
      setRisks(prev => [newRisk, ...prev]);
      form.setValue('mRiskId', newRisk.id);
    });
  }, [form]);

  // Calculate risk rating when likelihood or consequence changes
  const calculateRiskRating = async (isPostControl = false) => {
    const likelihoodLevel = form.getValues(isPostControl ? 'postLikelihoodLevel' : 'likelihoodLevel');
    const consequenceLevel = form.getValues(isPostControl ? 'postConsequenceLevel' : 'consequenceLevel');

    if (!likelihoodLevel || !consequenceLevel) return;

    try {
      // Pass likelihood as string (A, B, C, etc.) and consequence as number (1, 2, 3, etc.)
      const response = await riskAssessmentService.calculateRiskRating(likelihoodLevel.toUpperCase(), consequenceLevel);
      const interpretation = response.interpretation || response.riskLevel?.description?.split(' ')[0].toUpperCase();
      
      // Generate the combination code (e.g., A3, B2, B4) - format: {likelihoodLetter}{consequenceNumber}
      const riskMatrixCode = getRiskRatingCode(likelihoodLevel, consequenceLevel);
      
      if (isPostControl) {
        form.setValue('postRiskMatrixRating', riskMatrixCode);
        form.setValue('postInterpretation', interpretation);
      } else {
        form.setValue('riskMatrixRating', riskMatrixCode);
        form.setValue('interpretation', interpretation);
      }
    } catch (error) {
      toast.error('Failed to calculate risk rating');
    }
  };

  const handleSubmit = async (data: FormValues) => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      // Only include mitigation if at least one field has content
      const hasMitigation = data.mitigation && (
        data.mitigation.eliminate ||
        data.mitigation.transfer ||
        data.mitigation.reduce ||
        data.mitigation.accept
      );
      
      await onSubmit({
        mRiskId: data.mRiskId,
        mRiskCategoryId: data.mRiskCategoryId,
        likelihoodLevel: data.likelihoodLevel,
        consequenceLevel: data.consequenceLevel,
        riskMatrixRating: data.riskMatrixRating,
        interpretation: data.interpretation,
        postLikelihoodLevel: data.postLikelihoodLevel,
        postConsequenceLevel: data.postConsequenceLevel,
        postRiskMatrixRating: data.postRiskMatrixRating,
        postInterpretation: data.postInterpretation,
        mitigation: hasMitigation ? {
          eliminate: data.mitigation?.eliminate || undefined,
          transfer: data.mitigation?.transfer || undefined,
          reduce: data.mitigation?.reduce || undefined,
          accept: data.mitigation?.accept || undefined,
        } : undefined,
      });
    } finally {
      setIsSubmitting(false);
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
  // Format: {likelihoodLetter}{consequenceNumber} e.g., "A3" means likelihood A (level 1) and consequence 3
  const getRiskRatingCode = useCallback((likelihoodLevel: string, consequenceLevel: number): string => {
    if (!riskMatrixData || riskMatrixData.length === 0) return '';

    // Find matching entry in risk matrix (DB stores likelihoodLevel as String, consequenceLevel as Int)
    const matrixEntry = riskMatrixData.find(
      (entry) => entry.likelihoodLevel === likelihoodLevel && entry.consequenceLevel === consequenceLevel
    );
    
    // Format: {likelihoodLetter}{consequenceNumber} e.g., "A3"
    return `${likelihoodLevel}${consequenceLevel}`;
  }, [riskMatrixData]);

  // Sync risk rating when likelihood or consequence changes (pre-control)
  useEffect(() => {
    if (!likelihoodLevel || !consequenceLevel) return;
    
    const riskCode = getRiskRatingCode(likelihoodLevel, consequenceLevel);
    const currentValue = form.getValues('riskMatrixRating');
    
    if (riskCode && currentValue !== riskCode) {
      form.setValue('riskMatrixRating', riskCode, { shouldValidate: true });
    }
  }, [likelihoodLevel, consequenceLevel, form, getRiskRatingCode]);

  // Sync post risk rating when post likelihood or post consequence changes
  useEffect(() => {
    if (!postLikelihoodLevel || !postConsequenceLevel) return;
    
    const postRiskCode = getRiskRatingCode(postLikelihoodLevel, postConsequenceLevel);
    const currentValue = form.getValues('postRiskMatrixRating');
    
    if (postRiskCode && currentValue !== postRiskCode) {
      form.setValue('postRiskMatrixRating', postRiskCode, { shouldValidate: true });
    }
  }, [postLikelihoodLevel, postConsequenceLevel, form, getRiskRatingCode]);

  // Fetch risk mitigations when risk is selected and populate form fields for new items
  useEffect(() => {
    const fetchRiskMitigations = async () => {
      if (!selectedRiskId) {
        setRiskMitigations([]);
        return;
      }

      setIsLoadingRiskMitigations(true);
      try {
        const mitigations = await riskMitigationService.getByRiskId(selectedRiskId);
        setRiskMitigations(mitigations);
        
        // When creating new items (no initialItem.mitigation), pre-populate form with default mitigations
        // Only do this if the risk has changed (not on initial load with existing data)
        const hasExistingMitigation = initialItem?.mitigation && (
          initialItem.mitigation.eliminate ||
          initialItem.mitigation.transfer ||
          initialItem.mitigation.reduce ||
          initialItem.mitigation.accept
        );
        
        if (!hasExistingMitigation && mitigations.length > 0 && !isInitialMount.current) {
          // Combine all mitigations into a single object (in case there are multiple)
          const combinedMitigation = {
            eliminate: mitigations.map(m => m.eliminate).filter(Boolean).join('\n') || '',
            transfer: mitigations.map(m => m.transfer).filter(Boolean).join('\n') || '',
            reduce: mitigations.map(m => m.reduce).filter(Boolean).join('\n') || '',
            accept: mitigations.map(m => m.accept).filter(Boolean).join('\n') || '',
          };
          
          form.setValue('mitigation', combinedMitigation);
        }
      } catch (error) {
        console.error('Failed to fetch risk mitigations:', error);
        toast.error('Failed to load risk mitigation options');
        setRiskMitigations([]);
      } finally {
        setIsLoadingRiskMitigations(false);
      }
    };

    fetchRiskMitigations();
  }, [selectedRiskId, initialItem?.mitigation, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk assessment item details...</span>
        </div>
      </div>
    );
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="mRiskCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Risk Category <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  {showCard ? (
                    <SearchableSelect
                      options={riskCategoryOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select Risk Category"
                      searchPlaceholder="Search Risk Category..."
                      onSearch={handleSearchRiskCategories}
                      isLoading={isLoadingRiskCategories}
                      onCreateNew={handleCreateNewRiskCategory}
                      createNewText="Create new risk category"
                    />
                  ) : (
                    <ModalCombobox
                      options={riskCategoryOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select Risk Category"
                      searchPlaceholder="Search Risk Category..."
                      onSearch={handleSearchRiskCategories}
                      isLoading={isLoadingRiskCategories}
                      onCreateNew={handleCreateNewRiskCategory}
                      createNewText="Create new risk category"
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mRiskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Risk <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  {showCard ? (
                    <SearchableSelect
                      options={riskOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select risk"
                      searchPlaceholder="Search risk..."
                      onSearch={handleSearchRisks}
                      isLoading={isLoadingRisks}
                      onCreateNew={handleCreateNewRisk}
                      createNewText="Create new risk"
                    />
                  ) : (
                    <ModalCombobox
                      options={riskOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select risk"
                      searchPlaceholder="Search risk..."
                      onSearch={handleSearchRisks}
                      isLoading={isLoadingRisks}
                      onCreateNew={handleCreateNewRisk}
                      createNewText="Create new risk"
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="likelihoodLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Likelihood <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={likelihoodOptions}
                    value={field.value.toString()}
                    onValueChange={(value) => {
                      field.onChange(value);
                      calculateRiskRating(false);
                    }}
                    placeholder="Select level"
                    searchPlaceholder="Search likelihood level..."
                    emptyText="No likelihood levels found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="consequenceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Consequence <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <ModalCombobox
                    options={consequenceOptions}
                    value={field.value.toString()}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value, 10));
                      calculateRiskRating(false);
                    }}
                    placeholder="Select level"
                    searchPlaceholder="Search consequence level..."
                    emptyText="No consequence levels found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="riskMatrixRating"
            render={({ field }) => {
              const riskCode = getRiskRatingCode(likelihoodLevel, consequenceLevel);
              
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
            name="interpretation"
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

        {/* Risk Mitigation Section - Editable */}
        <div>
          <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
          {isLoadingRiskMitigations ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading risk mitigation template...</span>
              </div>
            </div>
          ) : selectedRiskId ? (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="mitigation.eliminate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Eliminate</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe elimination strategy..."
                        className="min-h-[120px] resize-y"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mitigation.transfer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Transfer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe transfer strategy..."
                        className="min-h-[120px] resize-y"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mitigation.reduce"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Reduce</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe reduction strategy..."
                        className="min-h-[120px] resize-y"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mitigation.accept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Accept</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe acceptance strategy..."
                        className="min-h-[120px] resize-y"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Please select a risk to enter mitigation strategies.
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Post-Control Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="postLikelihoodLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Post Likelihood <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ModalCombobox
                      options={likelihoodOptions}
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value, 10));
                        calculateRiskRating(true);
                      }}
                      placeholder="Select level"
                      searchPlaceholder="Search likelihood level..."
                      emptyText="No likelihood levels found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postConsequenceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Post Consequence <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ModalCombobox
                      options={consequenceOptions}
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value, 10));
                        calculateRiskRating(true);
                      }}
                      placeholder="Select level"
                      searchPlaceholder="Search consequence level..."
                      emptyText="No consequence levels found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postRiskMatrixRating"
              render={({ field }) => {
                const postRiskCode = getRiskRatingCode(postLikelihoodLevel, postConsequenceLevel);
                
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
              name="postInterpretation"
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

        {onSubmit && (
          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Item</CardTitle>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return formContent;
};

export default RiskAssessmentItemForm;
