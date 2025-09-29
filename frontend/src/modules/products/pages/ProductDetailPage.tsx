import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Eye, 
  Star, 
  Tag, 
  Calendar,
  User,
  FileText,
  Download,
  Link
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import PageHeader from '@/core/components/ui/PageHeader';
import { useProduct } from '../hooks/useProducts';
import { formatPrice, getProductStatusInfo, getProductTypeLabel } from '../types/product.types';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error, fetchProduct } = useProduct(id || null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (error && !isLoading) {
      toast.error('Product not found');
      navigate('/products');
    }
  }, [error, isLoading, navigate]);

  const handleDelete = async () => {
    if (!product) return;

    try {
      // Note: In a real implementation, you would call the delete API here
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = () => {
    if (product) {
      navigate(`/products/${product.id}/edit`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const statusInfo = getProductStatusInfo(product.status);

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`${getProductTypeLabel(product.productType)} • ${product.sku}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`capitalize ${
                    statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                    statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  } border-0`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Type
                  </div>
                  <div className="font-medium">{getProductTypeLabel(product.productType)}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Views
                  </div>
                  <div className="font-medium">{(product.viewCount || 0).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Rating
                  </div>
                  <div className="font-medium">{(product.rating || 0).toFixed(1)} ({product.reviewCount || 0} reviews)</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Download className="h-4 w-4" />
                    Downloads
                  </div>
                  <div className="font-medium">
                    {product.downloadLimit ? `Max ${product.downloadLimit}` : 'Unlimited'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {product.categoryNames && product.categoryNames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.categoryNames.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Regular Price</span>
                  <span className="font-medium">{formatPrice(product.price)}</span>
                </div>
                {product.isOnSale && product.salePrice && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sale Price</span>
                      <span className="font-medium text-green-600">{formatPrice(product.salePrice)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Save {formatPrice(product.price - product.salePrice)}
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Final Price</span>
                  <span>{formatPrice(product.finalPrice || product.price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={`${
                  product.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                } border-0`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {product.hasCourse && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course</span>
                  <Badge variant="secondary">Has Course</Badge>
                </div>
              )}
              {product.fileUrl && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(product.fileUrl, '_blank')}
                    className="h-auto py-1 px-2"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    View Asset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator</span>
                <span className="font-medium">{product.creator}</span>
              </div>
              {product.thumbnailUrl && (
                <div className="pt-3">
                  <div className="text-sm text-muted-foreground mb-2">Thumbnail</div>
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductDetailPage;
