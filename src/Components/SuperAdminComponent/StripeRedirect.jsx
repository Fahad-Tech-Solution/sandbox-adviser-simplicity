import { Button, Result } from "antd";
import { FrownOutlined, SmileOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

const headingStyle = { fontFamily: "Georgia,serif" };

export default function StripeRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");

  if (status === "success" || status === "renew") {
    return (
      <Result
        status="success"
        icon={<SmileOutlined />}
        title={<span style={headingStyle}>Payment Successful!</span>}
        subTitle="Thank you for your purchase. Your subscription is now active."
        extra={
          <Button
            type="primary"
            onClick={() =>
              navigate(status === "renew" ? "/user" : "/change-password")
            }
          >
            <span>Next Step</span>
          </Button>
        }
      />
    );
  }

  if (status === "cancel") {
    return (
      <Result
        status="error"
        icon={<FrownOutlined />}
        title={<span style={headingStyle}>Payment Cancelled</span>}
        subTitle="Your payment was cancelled. You can try again anytime."
        extra={
          <Button type="primary" onClick={() => navigate("/pricing-table")}>
            <span>Go Back to Pricing</span>
          </Button>
        }
      />
    );
  }

  return (
    <Result
      status="info"
      title={<span style={headingStyle}>Awaiting Payment Result...</span>}
      subTitle="You will be redirected once the payment status is determined."
    />
  );
}
