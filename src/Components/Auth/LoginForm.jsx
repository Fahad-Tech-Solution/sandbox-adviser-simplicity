import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useAtomValue, useSetAtom } from "jotai";
import logo from "../../assets/svg/Mobile login-pana.svg";
import adminLogo from "../../assets/svg/Telecommuting-pana.svg";
import useApi from "../../hooks/useApi";
import { loggedInUser } from "../../store/authState";

const { Title, Text } = Typography;

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const setLoggedInUser = useSetAtom(loggedInUser);
  const loggedInUserValue = useAtomValue(loggedInUser);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdminLogin = useMemo(
    () => location.pathname === "/auth/admin-login",
    [location.pathname],
  );

  const handleLogin = async (values) => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        email: values.email.toLowerCase().trim(),
        passwordHash: values.passwordHash.trim(),
      };
      const res = await api.post("/api/auth/login", payload);
      const user = res?.user ?? null;
      const token = res?.token ?? "";

      if (!user || !token) {
        throw new Error("Invalid login response.");
      }

      const permissions = user?.roleID?.permissions ?? [];

      setLoggedInUser({
        token,
        email: payload.email,
        user,
        permissions,
      });

      if (isAdminLogin) {
        if (!permissions.includes("superAdmin")) {
          throw new Error("Access denied. Admin role required.");
        }
        navigate("/super/admin", { replace: true });
        return;
      }

      if (permissions.includes("superAdmin")) {
        throw new Error("Use admin login for this account.");
      }

      navigate("/user", { replace: true });
      message.success("Login successful.");
    } catch (err) {
      let msg = err?.response?.data?.message || err?.message || "Login failed.";
      //if error is 401, show "Invalid email or password"
      if (err?.response?.status === 401) {
        msg = "Invalid email or password";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row g-0 h-100">
      <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
          onClick={() => {
            console.log(loggedInUserValue);
          }}
        >
          {isAdminLogin ? "Admin Login" : "Login"}
        </Title>
        <Text type="secondary">Enter your credentials to continue.</Text>

        {error ? (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginTop: 16, marginBottom: 6 }}
          />
        ) : null}

        <Form
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          style={{ marginTop: 18 }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
            className="mb-0"
          >
            <Input placeholder="someone@example.com" size="large" />
          </Form.Item>

          <Form.Item
            name="passwordHash"
            label="Password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
            className="mb-0 mt-2"
          >
            <Input.Password
              size="large"
              placeholder="Password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginBottom: 14 }}>
            <Link to="/auth/forget-password" style={{ color: "#22c55e" }}>
              Forgot Password?
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
          >
            Login
          </Button>
        </Form>

        {!isAdminLogin && (
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <Text type="secondary">Don&apos;t have an account? </Text>
            <Link to="/auth/register" style={{ color: "#22c55e" }}>
              Register
            </Link>
          </div>
        )}
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={!isAdminLogin ? logo : adminLogo}
          alt="Login illustration"
          style={{
            width: "100%",
            maxHeight: 420,
            objectFit: "contain",
            padding: 18,
          }}
        />
      </div>
    </div>
  );
}
