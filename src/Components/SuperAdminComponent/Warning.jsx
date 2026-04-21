import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Typography } from "antd";
import { IoWarningOutline } from "react-icons/io5";
import { FaRegBell } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function Warning() {
  const location = useLocation();
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);

  const warningConfig = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const messageType = params.get("message");

    if (messageType === "pricing table") {
      return {
        type: "error",
        message:
          "Your current subscription has ended. Visit the billing section to renew or upgrade your plan.",
      };
    }

    return {
      type: "warning",
      message:
        "Your access has been restricted by the Super Admin. Reach out to them to restore your account.",
    };
  }, [location.search]);

  useEffect(() => {
    const generated = Array.from({ length: 45 }, (_, index) => ({
      id: index,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      duration: Math.random() * 16 + 10,
      delay: Math.random() * 4,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="warning-screen">
      <div className="animated-bg">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <Card className="warning-card" bordered={false}>
        <div style={{ textAlign: "center" }}>
          {warningConfig.type === "warning" ? (
            <IoWarningOutline style={{ fontSize: 46, color: "#faad14" }} />
          ) : (
            <FaRegBell style={{ fontSize: 44, color: "#ff4d4f" }} />
          )}

          <Title
            level={2}
            style={{ marginTop: 12, marginBottom: 16, fontFamily: "Georgia,serif" }}
          >
            System Notice
          </Title>

          <Alert
            type={warningConfig.type}
            showIcon
            message={warningConfig.message}
            style={{ textAlign: "left", marginBottom: 20 }}
          />

          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => navigate(-1)}>
              <span style={{ fontFamily: "Georgia,serif" }}>Go Back</span>
            </Button>
            {warningConfig.type === "error" && (
              <Button type="primary" onClick={() => navigate("/pricing-table")}>
                <span style={{ fontFamily: "Georgia,serif" }}>Buy Subscription</span>
              </Button>
            )}
          </div>

          <Text type="secondary" style={{ marginTop: 12, display: "block" }}>
            If this issue persists, contact support.
          </Text>
        </div>
      </Card>

      <style>{`
        .warning-screen {
          position: relative;
          min-height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 16px;
          background: linear-gradient(135deg, #22c55e 0%, #22c55e 100%);
        }

        .animated-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(40deg, #22c55e, #22c55e, #22c55e);
          background-size: 300% 300%;
          animation: gradientMove 10s ease infinite;
          opacity: 0.92;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          animation-name: floatParticle;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          pointer-events: none;
        }

        .warning-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 640px;
          border-radius: 16px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.96);
          animation: cardIn 0.5s ease-out;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes floatParticle {
          from { transform: translateY(100vh) scale(1); opacity: 0; }
          15% { opacity: 1; }
          to { transform: translateY(-20vh) scale(1.2); opacity: 0; }
        }

        @keyframes cardIn {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
