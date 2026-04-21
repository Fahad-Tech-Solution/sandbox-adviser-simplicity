import { Suspense } from "react";
import { Spin } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./Components/Auth/AuthPage";
import PricingTable from "./Components/SuperAdminComponent/PricingTable";
import StripeRedirect from "./Components/SuperAdminComponent/StripeRedirect";
import Warning from "./Components/SuperAdminComponent/Warning";
import Unauthorized from "./Components/Auth/Unauthorized";
import UserLayout from "./Components/Layout/UserLayout";
import ProtectedRoute from "./Components/Routes/ProtectedRoute";

const publicRoutes = [
  { path: "/user/verify-email", element: <></> },
  { path: "/change-password", element: <></> },
  { path: "/pricing-table", element: <PricingTable /> },
  { path: "/buy-adviser-link", element: <></> },
  { path: "/stripe-redirect", element: <StripeRedirect /> },
  { path: "/user/warning", element: <Warning /> },
  { path: "/unauthorized", element: <Unauthorized /> },
];

export default function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <Routes>
        {/* Auth */}
        <Route path="/auth/*" element={<AuthPage />} />

        {/* Public */}
        {publicRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}

        {/* Protected: Super Admin */}
        <Route
          path="/super/admin"
          element={
            <ProtectedRoute
              element={<></>} // your super admin page
              requiredPermissions={["superAdmin"]}
            />
          }
        />

        {/* Protected: Cashflow */}
        <Route
          path="/user/cashflow"
          element={
            <ProtectedRoute
              element={<></>} // your cashflow page
              requiredPermissions={["cashflow"]}
            />
          }
        />

        {/* Protected: Main user area */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute
              element={<UserLayout />}
              requiredPermissions={["fact find", "prospects"]}
            />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  );
}
