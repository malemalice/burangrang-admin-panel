import { RouteConfig } from '@/core/routes/types';
import PPEStockInPage from '../pages/PPEStockInPage';
import PPEWithdrawPage from '../pages/PPEWithdrawPage';
import CreatePPEStockPage from '../pages/stocks/CreatePPEStockPage';
import PPEStockDetailPage from '../pages/stocks/PPEStockDetailPage';
import EditPPEStockPage from '../pages/stocks/EditPPEStockPage';
import CreatePPEWithdrawalPage from '../pages/withdrawals/CreatePPEWithdrawalPage';
import PPEWithdrawalDetailPage from '../pages/withdrawals/PPEWithdrawalDetailPage';
import EditPPEWithdrawalPage from '../pages/withdrawals/EditPPEWithdrawalPage';

const ppeRoutes: RouteConfig[] = [
    {
        path: '/ppe/stocks',
        component: PPEStockInPage,
    },
    {
        path: '/ppe/stocks/new',
        component: CreatePPEStockPage,
    },
    {
        path: '/ppe/stocks/:id',
        component: PPEStockDetailPage,
    },
    {
        path: '/ppe/stocks/:id/edit',
        component: EditPPEStockPage,
    },
    {
        path: '/ppe/withdrawals',
        component: PPEWithdrawPage,
    },
    {
        path: '/ppe/withdrawals/new',
        component: CreatePPEWithdrawalPage,
    },
    {
        path: '/ppe/withdrawals/:id',
        component: PPEWithdrawalDetailPage,
    },
    {
        path: '/ppe/withdrawals/:id/edit',
        component: EditPPEWithdrawalPage,
    },
];

export default ppeRoutes;

