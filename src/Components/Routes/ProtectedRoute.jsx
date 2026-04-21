import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { loggedInUser } from "../../store/authState";
import { Spin } from "antd";

export default function ProtectedRoute({ element, requiredPermissions = [] }) {
  const session = useAtomValue(loggedInUser);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if the atom has been hydrated from storage
  useEffect(() => {
    // Small delay to ensure atom storage is loaded
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while waiting for hydration
  if (!isHydrated) {
    return (
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
    ); // or your spinner component
  }

  // If session is still null after hydration, consider it as not authenticated
  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  const { token, user, permissions = [] } = session;

  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasPermission =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((p) => permissions.includes(p));

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}
