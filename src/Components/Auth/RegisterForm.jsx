import { useState } from "react";
import { App as AntdApp, Button, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import logo from "../../assets/svg/Privacy policy-rafiki.svg";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;

export default function RegisterForm() {
  const { message } = AntdApp.useApp();
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        userName: values.userName?.trim(),
        email: values.email?.toLowerCase().trim(),
        password: values.password,
      };
      await api.post("/api/auth/register", payload);
      message.success("Account created successfully. Please login.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed.";
      message.error(msg);
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
        >
          Register
        </Title>
        <Text type="secondary" className="text-center">
          Create your account.
        </Text>

        <Form
          layout="vertical"
          requiredMark={false}
          style={{ marginTop: 18 }}
          onFinish={handleRegister}
        >
          <Form.Item
            label="Name"
            name="userName"
            className="mb-0 mt-2"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input size="large" placeholder="Your name" />
          </Form.Item>

          <Form.Item label="Email" name="email" className="mb-0 mt-2">
            <Input size="large" placeholder="someone@example.com" />
          </Form.Item>
          
          <Form.Item
            label="Password"
            name="password"
            className=" mt-2"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
          >
            <Input.Password size="large" placeholder="Create password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            className="mt-2"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="Confirm password" />
          </Form.Item>
          <Button
            type="primary"
            size="large"
            block
            htmlType="submit"
            loading={submitting}
          >
            Create Account
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/auth/login" style={{ color: "#22c55e" }}>
            Login
          </Link>
        </div>
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="Register illustration"
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
