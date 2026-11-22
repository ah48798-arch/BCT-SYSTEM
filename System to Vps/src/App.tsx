import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { StudentCRM } from './pages/StudentCRM';
import { StudentProfile } from './pages/StudentProfile';
import { Pipeline } from './pages/Pipeline';
import { OrgChart } from './pages/OrgChart';
import { EmployeeDirectory } from './pages/EmployeeDirectory';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { RolesPermissions } from './pages/RolesPermissions';
import { CustomerServiceInbox } from './pages/CustomerServiceInbox';
import { CampaignsManagement } from './pages/CampaignsManagement';
import { CapacityGateCenter } from './pages/CapacityGateCenter';
import { HRCenter } from './pages/HRCenter';
import { QualityCenter } from './pages/QualityCenter';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { TaskCenter } from './pages/TaskCenter';
import { ComplaintsCenter } from './pages/ComplaintsCenter';
import { WorkflowsCenter } from './pages/WorkflowsCenter';
import { RaciMatrix } from './pages/RaciMatrix';
import { HandoffsCenter } from './pages/HandoffsCenter';
import { MeetingsCenter } from './pages/MeetingsCenter';
import { ReportsCenter } from './pages/ReportsCenter';
import { AuditLogViewer } from './pages/AuditLogViewer';
import { Settings } from './pages/Settings';
import { ChangePasswordPage } from './pages/ChangePasswordPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Dedicated Mandatory Password Change Route (Isolated from AppLayout/Dashboard queries) */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute allowPendingPasswordChange={true}>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Enterprise Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="executive" element={<ProtectedRoute requiredPermission="reports:view"><ExecutiveDashboard /></ProtectedRoute>} />
              
              {/* Students & CRM */}
              <Route path="crm" element={<ProtectedRoute requiredPermission="students:view"><StudentCRM /></ProtectedRoute>} />
              <Route path="students" element={<ProtectedRoute requiredPermission="students:view"><StudentCRM /></ProtectedRoute>} />
              <Route path="crm/:id" element={<ProtectedRoute requiredPermission="students:view"><StudentProfile /></ProtectedRoute>} />
              <Route path="students/:id" element={<ProtectedRoute requiredPermission="students:view"><StudentProfile /></ProtectedRoute>} />
              <Route path="crm/files/:id" element={<ProtectedRoute requiredPermission="students:view"><StudentProfile /></ProtectedRoute>} />
              <Route path="students/files/:id" element={<ProtectedRoute requiredPermission="students:view"><StudentProfile /></ProtectedRoute>} />
              <Route path="pipeline" element={<ProtectedRoute requiredPermission="students:view"><Pipeline /></ProtectedRoute>} />

              {/* Organization & Personnel */}
              <Route path="org-chart" element={<ProtectedRoute requiredPermission="users:view"><OrgChart /></ProtectedRoute>} />
              <Route path="organization" element={<ProtectedRoute requiredPermission="users:view"><OrgChart /></ProtectedRoute>} />
              <Route path="employees" element={<ProtectedRoute requiredPermission="users:view"><EmployeeDirectory /></ProtectedRoute>} />
              <Route path="departments" element={<ProtectedRoute requiredPermission="users:view"><DepartmentManagement /></ProtectedRoute>} />
              <Route path="roles" element={<ProtectedRoute requireAdmin={true} requiredPermission="settings:view"><RolesPermissions /></ProtectedRoute>} />
              <Route path="roles-permissions" element={<ProtectedRoute requireAdmin={true} requiredPermission="settings:view"><RolesPermissions /></ProtectedRoute>} />

              {/* Customer Service & Communications */}
              <Route path="inbox" element={<ProtectedRoute requiredPermission="students:view"><CustomerServiceInbox /></ProtectedRoute>} />
              <Route path="customer-service" element={<ProtectedRoute requiredPermission="students:view"><CustomerServiceInbox /></ProtectedRoute>} />

              {/* Marketing & Capacity Gate */}
              <Route path="marketing" element={<ProtectedRoute requiredPermission="campaigns:view"><CampaignsManagement /></ProtectedRoute>} />
              <Route path="capacity-gate" element={<ProtectedRoute requiredPermission="campaigns:view"><CapacityGateCenter /></ProtectedRoute>} />

              {/* HR & Quality */}
              <Route path="hr" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="hr/backups" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="hr/skills" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="hr/evaluations" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="hr/onboarding" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="hr/*" element={<ProtectedRoute requiredPermission="users:view"><HRCenter /></ProtectedRoute>} />
              <Route path="quality" element={<ProtectedRoute requiredPermission="complaints:view"><QualityCenter /></ProtectedRoute>} />

              {/* Finance */}
              <Route path="finance" element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/payments" element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/expenses" element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/budgets" element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/incentives" /* /finance/incentives */ element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/ledger" /* /finance/ledger */ element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />
              <Route path="finance/*" element={<ProtectedRoute requiredPermission="finance:view"><FinanceDashboard /></ProtectedRoute>} />

              {/* Core Operations & Collaboration */}
              <Route path="tasks" element={<ProtectedRoute requiredPermission="tasks:view"><TaskCenter /></ProtectedRoute>} />
              <Route path="complaints" element={<ProtectedRoute requiredPermission="complaints:view"><ComplaintsCenter /></ProtectedRoute>} />
              <Route path="workflows" element={<ProtectedRoute requiredPermission="handoffs:view"><WorkflowsCenter /></ProtectedRoute>} />
              <Route path="raci" element={<ProtectedRoute requiredPermission="handoffs:view"><RaciMatrix /></ProtectedRoute>} />
              <Route path="handoffs" element={<ProtectedRoute requiredPermission="handoffs:view"><HandoffsCenter /></ProtectedRoute>} />
              <Route path="meetings" element={<ProtectedRoute requiredPermission="tasks:view"><MeetingsCenter /></ProtectedRoute>} />

              {/* Governance & Reporting */}
              <Route path="reports" element={<ProtectedRoute requiredPermission="reports:view"><ReportsCenter /></ProtectedRoute>} />
              <Route path="audit-logs" element={<ProtectedRoute requiredPermission="settings:view"><AuditLogViewer /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute requiredPermission="settings:view"><Settings /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
