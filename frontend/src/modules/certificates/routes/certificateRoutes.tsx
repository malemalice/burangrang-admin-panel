import { RouteConfig } from '@/core/routes/types';
import CertificatesPage from '../pages/CertificatesPage';
import CreateCertificatePage from '../pages/CreateCertificatePage';
import EditCertificatePage from '../pages/EditCertificatePage';
import CertificateDetailPage from '../pages/CertificateDetailPage';
import CertificateCategoriesPage from '../pages/CertificateCategoriesPage';
import CreateCertificateCategoryPage from '../pages/CreateCertificateCategoryPage';
import EditCertificateCategoryPage from '../pages/EditCertificateCategoryPage';

const certificateRoutes: RouteConfig[] = [
    {
        path: '/certificates',
        component: CertificatesPage,
    },
    {
        path: '/certificates/new',
        component: CreateCertificatePage,
    },
    {
        path: '/certificates/:id/edit',
        component: EditCertificatePage,
    },
    {
        path: '/certificates/:id',
        component: CertificateDetailPage,
    },
    {
        path: '/master/certificate-categories/new',
        component: CreateCertificateCategoryPage,
    },
    {
        path: '/master/certificate-categories/:id/edit',
        component: EditCertificateCategoryPage,
    },
    {
        path: '/master/certificate-categories',
        component: CertificateCategoriesPage,
    },
];

export default certificateRoutes;

