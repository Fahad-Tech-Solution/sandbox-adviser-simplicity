import {
  BankOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FileTextOutlined,
  GiftOutlined,
  HomeOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  SettingOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Col, Row, Typography } from "antd";

import AdviceGoalCard from "../../../../Common/AdviceGoalCard";

const { Title } = Typography;

const GOAL_ITEMS = [
  { key: "buyAProperty", title: "Buy A Property", icon: HomeOutlined },
  {
    key: "payOffHomeLoan",
    title: "Pay Off The Home Loan",
    icon: CreditCardOutlined,
  },
  {
    key: "incomeProtectionInsurance",
    title: "Life & Income Protection Insurance",
    icon: SafetyOutlined,
  },
  { key: "buildSuperannuation", title: "Build Up Super", icon: WalletOutlined },
  {
    key: "retirementPlanning",
    title: "Plan For Retirement",
    icon: ClockCircleOutlined,
  },
  {
    key: "centreLinkEligibility",
    title: "Eligibility To Centrelink",
    icon: SettingOutlined,
  },
  { key: "investing", title: "Investing Money", icon: LineChartOutlined },
  {
    key: "moneyManagement",
    title: "Manage Our Money And Finances Better",
    icon: FileTextOutlined,
  },
  { key: "taxMinimization", title: "Pay Less Tax", icon: DollarOutlined },
  { key: "inheritancePlanning", title: "An Inheritance", icon: GiftOutlined },
  { key: "agedCare", title: "Aged Care", icon: MedicineBoxOutlined },
  {
    key: "selfManagedSuperFund",
    title: "Self Managed Super Fund",
    icon: BankOutlined,
  },
];

function normalizeAdviceValue(raw) {
  if (raw === true || raw === "Yes" || raw === "yes") return "Yes";
  if (raw === false || raw === "No" || raw === "no") return "No";
  if (raw === undefined || raw === null || raw === "") return "—";
  return String(raw);
}

/**
 * Read-only goals / area-of-advice view (same keys as legacy CDFForm).
 *
 * @param {Object} props
 * @param {Record<string, string|boolean>} [props.areaOfAdvice] - e.g. row.areaOfAdvice from CDF
 * @param {Object} [props.record] - optional full prospect row; uses record.raw?.areaOfAdvice if areaOfAdvice omitted
 */
export default function ViewGoals({ areaOfAdvice, record }) {
  const data =
    areaOfAdvice ?? record?.raw?.areaOfAdvice ?? record?.areaOfAdvice ?? {};

  return (
    <div style={{ paddingTop: 8 }}>
      <Title
        level={3}
        style={{
          margin: "0 0 20px",
          textAlign: "center",
          fontFamily: "Georgia,serif",
          fontWeight: 600,
          color: "#000",
          fontSize: 22,
        }}
      >
        Area of Advice Needed
      </Title>

      <Row gutter={[16, 16]} justify="center">
        {GOAL_ITEMS.map(({ key, title: label, icon: Icon }) => {
          const status = normalizeAdviceValue(data[key]);
          return (
            <Col key={key} xs={24} sm={12} md={8} lg={6}>
              <AdviceGoalCard label={label} Icon={Icon} status={status} />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
