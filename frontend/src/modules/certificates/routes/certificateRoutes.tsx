import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const CertificatesPage = lazy(() => import('../pages/CertificatesPage'));
const CreateCertificatePage = lazy(() => import('../pages/CreateCertificatePage'));
const EditCertificatePage = lazy(() => import('../pages/EditCertificatePage'));
const CertificateDetailPage = lazy(() => import('../pages/CertificateDetailPage'));
const CertificateCategoriesPage = lazy(() => import('../pages/CertificateCategoriesPage'));
const CreateCertificateCategoryPage = lazy(() => import('../pages/CreateCertificateCategoryPage'));
const EditCertificateCategoryPage = lazy(() => import('../pages/EditCertificateCategoryPage'));
const CertificateCategoryDetailPage = lazy(() => import('../pages/CertificateCategoryDetailPage'));

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
        path: '/master/certificate-categories/:id',
        component: CertificateCategoryDetailPage,
    },
    {
        path: '/master/certificate-categories',
        component: CertificateCategoriesPage,
    },
];

export default certificateRoutes;
