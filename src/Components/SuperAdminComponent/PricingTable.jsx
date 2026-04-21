import { useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Card, Col, Empty, Row, Skeleton, Switch, Tag, Typography } from "antd";
import { ArrowRightOutlined, CheckOutlined } from "@ant-design/icons";
import { useAtomValue } from "jotai";
import { useLocation } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { loggedInUser } from "../../store/authState";

const { Title, Text } = Typography;

function toCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function PricingTable() {
  const { message } = AntdApp.useApp();
  const api = useApi();
  const location = useLocation();
  const session = useAtomValue(loggedInUser);
  
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribingPriceId, setSubscribingPriceId] = useState("");
  const [hasPurchasedSubscription, setHasPurchasedSubscription] = useState(false);

  const email = session?.email || session?.user?.email || "";

  const blockedFromCurrentPath = useMemo(
    () => location.pathname.includes("/super/admin"),
    [location.pathname],
  );

  const fetchPricingPlans = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/products-with-prices");
      const products = Array.isArray(res?.products) ? res.products : [];
      setPlans(products);
      setHasPurchasedSubscription(Boolean(res?.hasPurchasedSubscription));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load pricing plans.");
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const handleSubscribe = async (priceId) => {
    try {
      if (!email) {
        message.error("Please login before subscribing.");
        return;
      }
      if (blockedFromCurrentPath) {
        message.error("Subscription is not allowed from this section.");
        return;
      }

      setSubscribingPriceId(priceId);
      const successStatus = hasPurchasedSubscription ? "renew" : "success";
      const payload = {
        priceId,
        email,
        successUrl: `${window.location.origin}/stripe-redirect?status=${successStatus}`,
        cancelUrl: `${window.location.origin}/stripe-redirect?status=cancel`,
      };

      const res = await api.post("/api/create-checkout-session", payload);
      const checkoutUrl = res?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("No checkout URL returned by server.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Failed to start checkout.");
    } finally {
      setSubscribingPriceId("");
    }
  };

  if (isLoading) {
    return (
      <Row gutter={[16, 16]} justify="center" style={{ padding: 24 }}>
        {[1, 2, 3].map((key) => (
          <Col key={key} xs={24} sm={12} lg={8}>
            <Card>
              <Skeleton.Image active style={{ width: "100%", height: 180 }} />
              <Skeleton active title paragraph={{ rows: 5 }} style={{ marginTop: 16 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (!plans.length) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Empty description="No pricing plans found." />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Choose a Plan
        </Title>
        <Text type="secondary">Pick the plan that best fits your needs.</Text>
      </div>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <Text style={{ marginRight: 8, color: !isYearly ? "#22c55e" : undefined }}>
          Monthly
        </Text>
        <Switch checked={isYearly} onChange={setIsYearly} />
        <Text style={{ marginLeft: 8, color: isYearly ? "#22c55e" : undefined }}>
          Yearly
        </Text>
      </div>

      <Row gutter={[16, 16]} justify="center">
        {plans.map((plan) => {
          const prices = Array.isArray(plan?.prices) ? plan.prices : [];
          const monthlyPrice = prices.find((p) => p.interval === "month");
          const yearlyPrice = prices.find((p) => p.interval === "year");
          const activePrice = isYearly ? yearlyPrice : monthlyPrice;

          const monthlyTotal = Number(monthlyPrice?.amount || 0) * 12;
          const yearlyTotal = Number(yearlyPrice?.amount || 0);
          const hasDiscount = isYearly && monthlyTotal > yearlyTotal && yearlyTotal > 0;

          return (
            <Col key={plan?.id || plan?.name} xs={24} md={12} lg={8} style={{ display: "flex" }}>
              <Card
                style={{ width: "100%", borderRadius: 14 }}
                title={plan?.name || "Plan"}
                cover={
                  plan?.images?.[0] ? (
                    <img
                      src={plan.images[0]}
                      alt={plan?.name || "Plan"}
                      style={{ width: "100%", height: 200, objectFit: "contain", padding: 16 }}
                    />
                  ) : null
                }
              >
                <div style={{ minHeight: 240, display: "flex", flexDirection: "column" }}>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <Title level={2} style={{ margin: 0 }}>
                      {activePrice ? toCurrency(activePrice.amount) : "--"}
                    </Title>
                    <Text type="secondary">per {activePrice?.interval || "--"}</Text>
                  </div>

                  {hasDiscount && (
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <Tag color="#22c55e">
                        Save {toCurrency(monthlyTotal - yearlyTotal)} vs monthly
                      </Tag>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Features</Text>
                    <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: 8 }}>
                      {(plan?.marketing_features || []).map((feature, index) => (
                        <li key={`${plan?.id}-${index}`} style={{ marginBottom: 8 }}>
                          <CheckOutlined style={{ color: "#22c55e", marginRight: 8 }} />
                          <Text type="secondary">{feature}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <Button
                      type="primary"
                      block
                      icon={<ArrowRightOutlined />}
                      disabled={!activePrice?.price_id}
                      loading={subscribingPriceId === activePrice?.price_id}
                      onClick={() => activePrice?.price_id && handleSubscribe(activePrice.price_id)}
                    >
                      Subscribe
                    </Button>
                    <Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
                      Secure payment via Stripe.
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
