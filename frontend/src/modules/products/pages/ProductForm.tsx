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
  PRODUCT_STATUSES 
} from '../types/product.types';

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  salePrice: z.number().min(0, 'Sale price must be positive').optional(),
  sku: z.string().min(1, 'SKU is required'),
  productType: z.enum(['EBOOK', 'COURSE', 'VIDEO', 'BUNDLE']),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
  downloadLimit: z.number().min(1, 'Download limit must be at least 1').optional(),
  thumbnailUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).default([]),
  courseId: z.string().optional(), // Course selection for COURSE product type
  fileUrl: z.string().url('Invalid file URL').optional().or(z.literal('')), // PDF file URL for EBOOK product type
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
      sku: '',
      productType: 'EBOOK',
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
      
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price,
        salePrice: product.salePrice || 0, // ✅ Fixed: Use 0 instead of undefined
        sku: product.sku,
        productType: product.productType,
        status: product.status,
        downloadLimit: product.downloadLimit || 0, // ✅ Fixed: Use 0 instead of undefined
        thumbnailUrl: product.thumbnailUrl || '',
        isActive: product.isActive,
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
        price: data.price,
        salePrice: data.salePrice && data.salePrice > 0 ? data.salePrice : undefined, // ✅ Fixed: Convert 0 back to undefined
        sku: data.sku,
        productType: data.productType,
        status: data.status,
        downloadLimit: data.downloadLimit && data.downloadLimit > 0 ? data.downloadLimit : undefined, // ✅ Fixed: Convert 0 back to undefined
        thumbnailUrl: data.thumbnailUrl || undefined,
        fileUrl: data.fileUrl && data.fileUrl !== '' ? data.fileUrl : undefined, // Include file URL for EBOOK products
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
                        if (value !== 'COURSE') {
                          form.setValue('courseId', 'none');
                        }
                        // Clear file selection when product type changes
                        if (value !== 'EBOOK') {
                          form.setValue('fileUrl', '');
                        }
                      }} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                {form.watch('productType') === 'COURSE' && (
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
              <h3 className="text-lg font-medium">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ''} // ✅ Fixed: Handle undefined values properly
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
            {form.watch('productType') === 'EBOOK' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Digital Content</h3>
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          value={field.value || ''}
                          onChange={(value) => field.onChange(value || '')}
                          categoryName="documents"
                          isPublic={true}
                          maxSize={50 * 1024 * 1024} // 50MB for documents
                          allowedTypes={['application/pdf']}
                          acceptedFileTypes=".pdf"
                          placeholder="Upload PDF file for this ebook"
                          disabled={isLoading}
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
