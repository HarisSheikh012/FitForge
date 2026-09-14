import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Dashboard page
import { Dashboard } from '../pages/dashboard/Dashboard';

// Members pages
import { MemberList } from '../pages/members/MemberList';
import { MemberDetails } from '../pages/members/MemberDetails';
import { MemberForm } from '../pages/members/MemberForm';

// Other screens
import { TrainerList } from '../pages/trainers/TrainerList';
import { StaffList } from '../pages/staff/StaffList';
import { Attendance } from '../pages/attendance/Attendance';
import { ClassSchedules } from '../pages/classes/ClassSchedules';
import { MembershipPlans } from '../pages/plans/MembershipPlans';
import { PaymentsList } from '../pages/payments/PaymentsList';
import { EquipmentList } from '../pages/equipment/EquipmentList';
import { Reports } from '../pages/reports/Reports';
import { Settings } from '../pages/settings/Settings';
import { NotificationsList } from '../pages/notifications/NotificationsList';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'members',
        children: [
          { index: true, element: <MemberList /> },
          { path: 'new', element: <MemberForm /> },
          { path: 'edit/:id', element: <MemberForm /> },
          { path: ':id', element: <MemberDetails /> },
        ],
      },
      {
        path: 'trainers',
        element: <TrainerList />,
      },
      {
        path: 'staff',
        element: <StaffList />,
      },
      {
        path: 'attendance',
        element: <Attendance />,
      },
      {
        path: 'classes',
        element: <ClassSchedules />,
      },
      {
        path: 'plans',
        element: <MembershipPlans />,
      },
      {
        path: 'payments',
        element: <PaymentsList />,
      },
      {
        path: 'equipment',
        element: <EquipmentList />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'notifications',
        element: <NotificationsList />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
]);
