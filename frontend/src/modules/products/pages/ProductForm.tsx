import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { X } from 'lucide-react';
import productService from '../services/productService';
import { categoryService } from '@/modules/categories';
import { courseService } from '@/modules/courses';
import { ImageUpload } from '@/modules/uploads';
import FileUpload from '@/modules/uploads/components/FileUpload';
import { 
  Product, 
  CreateProductDTO, 
  UpdateProductDTO, 
  ProductFormData,
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  formatPriceInput,
  parsePrice
} from '../types/product.types';
import { PRODUCT_TYPE_NAMES, ProductTypeName } from '@/shared/constants/product-types';

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  salePrice: z.number().min(0, 'Sale price must be positive').optional(),
  isFreePrice: z.boolean().default(false),
  minFreePrice: z.number().min(0, 'Minimum price must be positive').optional(),
  maxFreePrice: z.number().min(0, 'Maximum price must be positive').optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  productType: z.enum(Object.values(PRODUCT_TYPE_NAMES) as [string, ...string[]]) as z.ZodType<ProductTypeName>, // ✅ Use global constants with proper typing
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
  downloadLimit: z.number().min(1, 'Download limit must be at least 1').optional(),
  thumbnailUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).default([]),
  courseId: z.string().optional(), // Course selection for COURSE product type
  fileUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')), // File URL for EBOOK (PDF), VIDEO/AUDIO (link URL) product types
}).superRefine((data, ctx) => {
  // If isFreePrice is true, minFreePrice is required
  if (data.isFreePrice) {
    if (!data.minFreePrice || data.minFreePrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum price is required when self-price is enabled',
        path: ['minFreePrice'],
      });
    }
    // If both min and max are set, max must be greater than or equal to min
    if (data.minFreePrice && data.maxFreePrice && data.maxFreePrice < data.minFreePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum price must be greater than or equal to minimum price',
        path: ['maxFreePrice'],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product;
  mode: 'create' | 'edit';
}

const ProductForm = ({ product, mode }: ProductFormProps) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string; description?: string; thumbnailUrl?: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      price: 0,
      salePrice: 0, // ✅ Fixed: Use 0 instead of undefined for numeric fields
      isFreePrice: false,
      minFreePrice: 1000, // Default minimum price
      maxFreePrice: null, // No limit by default
      sku: '',
      productType: product?.productType || PRODUCT_TYPE_NAMES.E_BOOK, // ✅ Use product type if available
      status: 'DRAFT',
      downloadLimit: 0, // ✅ Fixed: Use 0 instead of undefined for numeric fields
      thumbnailUrl: '',
      isActive: true,
      categoryIds: [],
      courseId: 'none',
      fileUrl: '',
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        setDataReady(false);
        
        const [categoriesResponse, coursesResponse] = await Promise.all([
          categoryService.getCategories({ page: 1, limit: 100 }),
          courseService.getCourses({ page: 1, limit: 100 })
        ]);
        
        setCategories(categoriesResponse.data);
        setCourses(coursesResponse.data);
        
        setDataReady(true);
      } catch (error) {
        console.error('Failed to load form options:', error);
        toast.error('Failed to load form options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (product && dataReady) {
      // Set selected categories based on product data
      // Since Product has categoryIds and categoryNames, we need to reconstruct the category objects
      const selectedCats = (product.categoryIds || []).map((categoryId, index) => ({
        id: categoryId,
        name: product.categoryNames?.[index] || 'Unknown Category'
      }));
      setSelectedCategories(selectedCats);
      
      // Ensure productType is valid, fallback to EBOOK if not
      const validProductType = product.productType && Object.values(PRODUCT_TYPE_NAMES).includes(product.productType as ProductTypeName) 
        ? product.productType as ProductTypeName
        : PRODUCT_TYPE_NAMES.E_BOOK;
      
      // Ensure status is valid and uppercase, fallback to DRAFT if not
      const statusValues = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const;
      const upperStatus = product.status?.toUpperCase();
      const validStatus = (upperStatus && statusValues.includes(upperStatus as typeof statusValues[number]))
        ? upperStatus as typeof statusValues[number]
        : 'DRAFT';
      
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price,
        salePrice: product.salePrice ?? 0, // Use nullish coalescing to allow 0 values
        isFreePrice: product.isFreePrice ?? false,
        minFreePrice: product.minFreePrice ?? 1000,
        maxFreePrice: product.maxFreePrice ?? null,
        sku: product.sku,
        productType: validProductType, // ✅ Ensure valid product type
        status: validStatus, // ✅ Ensure valid status
        downloadLimit: product.downloadLimit ?? 0, // Use nullish coalescing to allow 0 values
        thumbnailUrl: product.thumbnailUrl || '',
        isActive: product.isActive ?? true,
        categoryIds: product.categoryIds || [],
        courseId: product.course?.id || 'none',
        fileUrl: product.fileUrl || '',
      });
    }
  }, [product, dataReady, form]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const generatedSlug = productService.generateSlug(name);
    form.setValue('slug', generatedSlug);
  };

  // Handle category selection toggle
  const handleCategoryToggle = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const isSelected = selectedCategories.some(cat => cat.id === categoryId);
    
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId));
      form.setValue('categoryIds', form.getValues('categoryIds').filter(id => id !== categoryId));
    } else {
      setSelectedCategories(prev => [...prev, category]);
      form.setValue('categoryIds', [...form.getValues('categoryIds'), categoryId]);
    }
  };

  // Handle course selection and inherit course data
  const handleCourseSelection = (courseId: string) => {
    const selectedCourse = courses.find(course => course.id === courseId);
    if (!selectedCourse) return;

    // Inherit course data when course is selected
    form.setValue('courseId', courseId);
    
    // Auto-fill product details from course
    form.setValue('name', selectedCourse.title);
    form.setValue('description', selectedCourse.description || '');
    form.setValue('thumbnailUrl', selectedCourse.thumbnailUrl || '');
    
    // Auto-generate slug from course title
    const generatedSlug = productService.generateSlug(selectedCourse.title);
    form.setValue('slug', generatedSlug);
    
    // Auto-generate SKU from course
    const generatedSku = `COURSE-${selectedCourse.id.slice(0, 8).toUpperCase()}`;
    form.setValue('sku', generatedSku);
    
    toast.success('Course data inherited successfully');
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Convert form data to DTO format
      const productData: CreateProductDTO | UpdateProductDTO = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        shortDescription: data.shortDescription || undefined,
        price: data.price, // Allow 0 for free products
        salePrice: data.salePrice !== undefined && data.salePrice !== null ? data.salePrice : undefined, // Allow 0 for free sale price
        isFreePrice: data.isFreePrice,
        minFreePrice: data.isFreePrice && data.minFreePrice ? data.minFreePrice : undefined,
        maxFreePrice: data.isFreePrice && data.maxFreePrice ? data.maxFreePrice : undefined,
        sku: data.sku,
        productType: data.productType,
        status: data.status,
        downloadLimit: data.downloadLimit !== undefined && data.downloadLimit !== null && data.downloadLimit > 0 ? data.downloadLimit : undefined, // Only exclude 0, allow positive values
        thumbnailUrl: data.thumbnailUrl || undefined,
        fileUrl: data.fileUrl && data.fileUrl.trim() !== '' ? data.fileUrl : undefined, // Include file URL for EBOOK products
        isActive: data.isActive,
        categoryIds: data.categoryIds,
        courseId: data.courseId && data.courseId !== 'none' ? data.courseId : undefined, // Include course association for COURSE products
      };

      if (mode === 'create') {
        await productService.createProduct(productData as CreateProductDTO);
        toast.success('Product created successfully');
      } else if (product) {
        await productService.updateProduct(product.id, productData as UpdateProductDTO);
        toast.success('Product updated successfully');
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${mode} product`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dataReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} Product</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter product name" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNameChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="product-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="PROD-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the product"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Details</h3>
                
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Clear course selection when product type changes
                        if (value !== PRODUCT_TYPE_NAMES.COURSE) {
                          form.setValue('courseId', 'none');
                        }
                        // Clear file selection when product type changes to types that don't use fileUrl
                        if (value === PRODUCT_TYPE_NAMES.COURSE || value === PRODUCT_TYPE_NAMES.BUNDLE) {
                          form.setValue('fileUrl', '');
                        }
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Course Selection - Only show when product type is COURSE */}
                {form.watch('productType') === PRODUCT_TYPE_NAMES.COURSE && (
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Course</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value === 'none' ? '' : value);
                            if (value && value !== 'none') {
                              handleCourseSelection(value);
                            }
                          }} 
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course to inherit data from" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No course selected</SelectItem>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                <div className="flex items-center gap-2">
                                  {course.thumbnailUrl && (
                                    <img 
                                      src={course.thumbnailUrl} 
                                      alt={course.title}
                                      className="w-6 h-6 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{course.title}</div>
                                    {course.description && (
                                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                        {course.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-600">
                          Select a course to automatically inherit its title, description, and thumbnail. 
                          The product will be linked to this course.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Select categories for this product</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                              <Badge
                                key={category.id}
                                variant={selectedCategories.some(cat => cat.id === category.id) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleCategoryToggle(category.id)}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                          {selectedCategories.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Selected categories:</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedCategories.map(category => (
                                  <Badge key={category.id} className="flex items-center gap-1">
                                    {category.name}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => handleCategoryToggle(category.id)}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Thumbnail</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={(value) => field.onChange(value || '')}
                          categoryName="system-assets"
                          isPublic={true}
                          maxSize={10 * 1024 * 1024} // 10MB for system assets (product thumbnails)
                          allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                          placeholder="Upload product thumbnail image"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing (in Indonesian Rupiah)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => {
                    const isFreePriceEnabled = form.watch('isFreePrice');
                    return (
                      <FormItem>
                        <FormLabel>Price (Rp)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <Input 
                              type="text"
                              placeholder="0"
                              className="pl-8"
                              disabled={isFreePriceEnabled}
                              value={field.value !== undefined && field.value !== null ? formatPriceInput(field.value) : ''}
                              onChange={(e) => {
                                const parsed = parsePrice(e.target.value);
                                field.onChange(parsed);
                              }}
                            />
                          </div>
                        </FormControl>
                        <p className="text-sm text-gray-600">
                          {isFreePriceEnabled 
                            ? 'Price is disabled when self-pricing is enabled'
                            : 'Enter price in Indonesian Rupiah (e.g., 50000 for Rp 50,000)'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => {
                    const isFreePriceEnabled = form.watch('isFreePrice');
                    return (
                      <FormItem>
                        <FormLabel>Sale Price (Optional) (Rp)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <Input 
                              type="text"
                              placeholder="0"
                              className="pl-8"
                              disabled={isFreePriceEnabled}
                              value={field.value !== undefined && field.value !== null ? formatPriceInput(field.value) : ''}
                              onChange={(e) => {
                                const parsed = parsePrice(e.target.value);
                                field.onChange(parsed >= 0 ? parsed : 0);
                              }}
                            />
                          </div>
                        </FormControl>
                        <p className="text-sm text-gray-600">
                          {isFreePriceEnabled 
                            ? 'Sale price is disabled when self-pricing is enabled'
                            : 'Enter sale price in Indonesian Rupiah (e.g., 40000 for Rp 40,000)'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Self Price Toggle */}
              <FormField
                control={form.control}
                name="isFreePrice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Self-Pricing</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow users to set their own price during checkout
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

              {/* Min/Max Free Price Fields - Only show when isFreePrice is enabled */}
              {form.watch('isFreePrice') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minFreePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Price (Rp) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <Input 
                              type="text"
                              placeholder="1000"
                              className="pl-8"
                              value={field.value ? formatPriceInput(field.value) : ''}
                              onChange={(e) => {
                                const parsed = parsePrice(e.target.value);
                                field.onChange(parsed > 0 ? parsed : 1000);
                              }}
                            />
                          </div>
                        </FormControl>
                        <p className="text-sm text-gray-600">
                          Minimum price users can set (e.g., 1000 for Rp 1,000)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxFreePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Price (Rp) (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <Input 
                              type="text"
                              placeholder="No limit"
                              className="pl-8"
                              value={field.value ? formatPriceInput(field.value) : ''}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                if (value === '') {
                                  field.onChange(null);
                                } else {
                                  const parsed = parsePrice(value);
                                  field.onChange(parsed > 0 ? parsed : null);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <p className="text-sm text-gray-600">
                          Maximum price users can set. Leave empty for no limit.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Digital Product Limits */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Digital Product Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="downloadLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Download Limit (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          {...field}
                          value={field.value || ''} // ✅ Fixed: Handle undefined values properly
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">
                        Leave empty for unlimited downloads. Set a number to limit how many times customers can download this digital product.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Upload for EBOOK products */}
            {form.watch('productType') === PRODUCT_TYPE_NAMES.E_BOOK && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Digital Content</h3>
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PDF File</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value || ''}
                          onChange={(value) => {
                            // Ensure we handle empty values properly
                            field.onChange(value && value.trim() !== '' ? value : '');
                          }}
                          categoryName="documents"
                          isPublic={true}
                          maxSize={50 * 1024 * 1024} // 50MB for documents
                          allowedTypes={['application/pdf']}
                          acceptedFileTypes=".pdf"
                          placeholder="Upload PDF file for this ebook"
                          disabled={isLoading}
                          existingFileName={product?.fileUrl ? product.fileUrl.split('/').pop() : undefined}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">
                        Upload a PDF file for this ebook. Maximum file size: 50MB.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* URL Input for VIDEO products */}
            {form.watch('productType') === PRODUCT_TYPE_NAMES.VIDEO && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Video Content</h3>
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/video.mp4 or YouTube/Vimeo embed URL"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">
                        Enter the direct URL to the video file or a YouTube/Vimeo embed URL. This will be used as the main video content for this product.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* URL Input for AUDIO products */}
            {form.watch('productType') === PRODUCT_TYPE_NAMES.AUDIO && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Audio Content</h3>
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audio URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/audio.mp3 or streaming URL"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">
                        Enter the direct URL to the audio file or streaming URL. This will be used as the main audio content for this product.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the product"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Product is available for purchase
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
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Create Product' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
