import { useMemo, useState } from "react";
import { App as AntdApp, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/svg/Enter OTP-pana.svg";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;

export default function ForgetPasswordForm() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const api = useApi();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const heading = useMemo(() => {
    if (step === 2) return "Verify OTP";
    if (step === 3) return "Reset Password";
    return "Forgot Password";
  }, [step]);

  const subtitle = useMemo(() => {
    if (step === 2) return "Enter the OTP sent to your email.";
    if (step === 3) return "Enter your new password.";
    return "Enter your email for reset instructions.";
  }, [step]);

  const handleSendOtp = async (values) => {
    try {
      setSubmitting(true);
      const cleanedEmail = values.email?.toLowerCase().trim();
      await api.patch("/api/auth/forgot-password", { email: cleanedEmail });
      setEmail(cleanedEmail);
      setStep(2);
      message.success("OTP sent to your email.");
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (values) => {
    try {
      setSubmitting(true);
      const cleanedOtp = values.otp?.trim();
      await api.post("/api/auth/verify-otp", { email, otp: cleanedOtp });
      setOtp(cleanedOtp);
      setStep(3);
      message.success("OTP verified.");
    } catch (err) {
      message.error(err?.response?.data?.message || "OTP verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (values) => {
    try {
      setSubmitting(true);
      await api.patch("/api/auth/reset-password", {
        email,
        otp,
        newPassword: values.newPassword,
      });
      message.success("Password updated successfully.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row g-0 h-100 ">
      <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
        >
          {heading}
        </Title>
        <Text type="secondary" className="text-center w-100">
          {subtitle}
        </Text>

        {step === 1 && (
          <Form
            layout="vertical"
            requiredMark={false}
            style={{ marginTop: 18 }}
            onFinish={handleSendOtp}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input size="large" placeholder="someone@example.com" />
            </Form.Item>
            <Button type="primary" size="large" block htmlType="submit" loading={submitting}>
              Send OTP
            </Button>
          </Form>
        )}

        {step === 2 && (
          <Form
            layout="vertical"
            requiredMark={false}
            style={{ marginTop: 18 }}
            onFinish={handleVerifyOtp}
          >
            <Form.Item
              label="OTP"
              name="otp"
              rules={[{ required: true, message: "OTP is required" }]}
            >
              <Input.OTP length={6} size="large" />
            </Form.Item>
            <Button type="primary" size="large" block htmlType="submit" loading={submitting}>
              Verify OTP
            </Button>
          </Form>
        )}

        {step === 3 && (
          <Form
            layout="vertical"
            requiredMark={false}
            style={{ marginTop: 18 }}
            onFinish={handleReset}
          >
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "New password is required" },
                { min: 8, message: "Minimum 8 characters" },
              ]}
            >
              <Input.Password size="large" placeholder="New password" />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="Confirm password" />
            </Form.Item>
            <Button type="primary" size="large" block htmlType="submit" loading={submitting}>
              Reset Password
            </Button>
          </Form>
        )}

        <div style={{ textAlign: "center", marginTop: 14 }}>
          {step === 1 ? (
            <Link to="/auth/login" style={{ color: "#22c55e" }}>
              Back to login
            </Link>
          ) : (
            <Button type="link" onClick={() => setStep(1)}>
              Resend OTP
            </Button>
          )}
        </div>
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="Forgot password illustration"
          style={{ width: "100%", maxHeight: 420, objectFit: "contain", padding: 18 }}
        />
      </div>
    </div>
  );
}
