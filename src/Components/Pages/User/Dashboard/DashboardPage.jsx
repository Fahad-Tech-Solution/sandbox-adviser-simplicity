import { Button, Card, Col, Form, Progress, Row, Typography } from "antd";
import { useState } from "react";
import AppModal from "../../../Common/AppModal";
import useTitleBlock from "../../../../hooks/useTitleBlock";
import SuperFund from "./components/SuperFund";
import YesNoSwitch from "../../../Common/YesNoSwitch";

const { Title, Text } = Typography;

const headingStyle = { fontFamily: "Georgia,serif" };

function StatCard({ index, title, value, accent = "#22c55e" }) {
  return (
    <Card
      styles={{
        body: {
          padding: "28px 24px",
        },
      }}
      style={{
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        height: "100%",
        border:
          index === 0 || index === 4
            ? "1px solid rgba(34, 197, 94, .3)"
            : "1px solid rgba(0, 0, 0, .08)",
      }}
    >
      <span
        style={{
          color: "#9ca3af",
          letterSpacing: "2.5px",
          fontSize: "10px",
          fontFamily: "Arial,serif",
          textTransform: "uppercase",
          marginBottom: "0px",
          display: "inline-block",
          lineHeight: "12px",
        }}
      >
        {title.toUpperCase()}
      </span>
      <Title
        level={3}
        style={{
          margin: "0px 0 0",
          fontFamily: "Georgia,serif",
          fontSize: "36px",
          fontWeight: "300",
        }}
      >
        <span style={{ color: accent }}>A{value}</span>
      </Title>
    </Card>
  );
}

function ProgressRow({ label, value, color }) {
  const percent = 100;
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: color,
              boxShadow: `0 0 0 4px ${color}22`,
            }}
          />
          <Text style={{ fontWeight: 600, fontFamily: "Georgia,serif" }}>
            {label}
          </Text>
        </div>
        <Text style={{ fontFamily: "Georgia,serif", color: "#111827" }}>
          {value}
        </Text>
      </div>
      <Progress
        percent={percent}
        showInfo={false}
        strokeWidth={10}
        trailColor="#F3F4F6"
        strokeColor={color}
        style={{ marginTop: 10 }}
      />
    </div>
  );
}

function ClientGenderRow({ label, value, icon, color }) {
  const percent = 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
          <Text style={{ fontFamily: "Georgia,serif", fontWeight: 600 }}>
            {label}
          </Text>
        </div>
        <Text style={{ fontFamily: "Georgia,serif" }}>{value}</Text>
      </div>
      <Progress
        percent={percent}
        showInfo={false}
        strokeWidth={10}
        trailColor="#F3F4F6"
        strokeColor={color}
        style={{ marginTop: 10 }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [superFundForm] = Form.useForm();
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });

  const stats = [
    { title: "Total FUM", value: "$106M", accent: "#22c55e" },
    { title: "Annual Premiums", value: "$854K", accent: "#111827" },
    { title: "Ongoing Income", value: "$644K", accent: "#111827" },
    { title: "Ongoing Commission", value: "$118K", accent: "#111827" },
    { title: "Total Income", value: "$762K", accent: "#22c55e" },
  ];

  const genders = [
    { label: "Female", value: 230, icon: "👩", color: "#FF6B6B" },
    { label: "Male", value: 189, icon: "👨", color: "#22c55e" },
  ];

  const totalClients = 419;

  const riskProfiles = [
    { label: "Cash", value: 18, color: "#1677ff" },
    { label: "Conservative", value: 62, color: "#22c55e" },
    { label: "Moderately Conservative", value: 158, color: "#fa8c16" },
    { label: "Balanced", value: 74, color: "#00000040" },
    { label: "Growth", value: 20, color: "#fadb14" },
  ];

  return (
    <div style={{ padding: 12 }}>
      <Text
        type="secondary"
        style={{
          fontFamily: "Arial,serif",
          fontWeight: 500,
          letterSpacing: "3px",
          fontSize: "11px",
          color: "#22c55e",
        }}
      >
        ADMIN
      </Text>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Title
          level={3}
          style={{ ...headingStyle, margin: 0, fontWeight: "500" }}
        >
          Practice Overview
        </Title>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#22c55e",
            }}
          />
          <Text
            type="secondary"
            style={{
              fontWeight: 500,
              fontSize: "11px",
              letterSpacing: "1px",
            }}
          >
            LIVE DATA
          </Text>
        </div>
      </div>

      <AppModal
        blur="false"
        width={550}
        open={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        title={renderTitleBlock({ title: "Super Funds", icon: "🐷" })}
        footer={
          <div className="d-flex align-items-center justify-content-end gap-2">
            <Button
              color="default"
              variant="filled"
              onClick={() => setIsStrategyModalOpen(false)}
            >
              Close
            </Button>
            {editMode ? (
              <Button
                type="primary"
                onClick={() => {
                  superFundForm.submit();
                  setIsStrategyModalOpen(false);
                }}
              >
                Save
              </Button>
            ) : (
              <Button
                color="default"
                variant="solid"
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            )}
          </div>
        }
      >
        <SuperFund form={superFundForm} editMode={editMode} />
      </AppModal>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        {stats.map((s, index) => (
          <div key={s.title}>
            <StatCard
              index={index}
              title={s.title}
              value={s.value}
              accent={s.accent}
            />
          </div>
        ))}
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 14,
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            }}
            title={
              <span style={{ ...headingStyle, fontWeight: 700 }}>
                CLIENTS BY GENDER
              </span>
            }
          >
            <ClientGenderRow {...genders[0]} />
            <ClientGenderRow {...genders[1]} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <Text
                type="secondary"
                style={{ fontFamily: "Georgia,serif", fontWeight: 600 }}
              >
                Total Clients
              </Text>
              <Title
                level={4}
                style={{ margin: 0, fontFamily: "Georgia,serif" }}
              >
                {totalClients}
              </Title>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 14,
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            }}
            title={
              <span style={{ ...headingStyle, fontWeight: 700 }}>
                RISK PROFILES
              </span>
            }
          >
            <div style={{ display: "grid", gap: 14 }}>
              {riskProfiles.map((r) => (
                <ProgressRow
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  color={r.color}
                />
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
