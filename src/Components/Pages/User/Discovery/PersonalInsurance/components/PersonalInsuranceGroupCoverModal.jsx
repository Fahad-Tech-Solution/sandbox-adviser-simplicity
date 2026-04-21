import { Col, Form, Row } from "antd";
import { useMemo } from "react";
import DynamicDataTable from "../../../../../Common/DynamicDataTable.jsx";
import { InvestmentOffersData } from "../../../../../../store/authState";
import { useAtomValue } from "jotai";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

export default function PersonalInsuranceGroupCoverModal({ modalData }) {
  const { parentForm } = modalData || {};
  const groupCoverValue =
    Form.useWatch("groupCover", parentForm) ||
    parentForm?.getFieldValue?.("groupCover") ||
    {};

  const investmentOffers = useAtomValue(InvestmentOffersData);

  const providerOptions = useMemo(() => {
    const funds = Array.isArray(investmentOffers?.SuperannuationFunds)
      ? investmentOffers.SuperannuationFunds
      : [];

    return funds.map((item) => ({
      value: item?._id || item?.value || item?.platformName || item?.name || "",
      label: item?.platformName || item?.label || item?.name || "Unknown",
    }));
  }, [investmentOffers]);

  const rows = useMemo(() => {
    const safeProviderOptions = Array.isArray(providerOptions)
      ? providerOptions
      : [];
    const providerId =
      groupCoverValue?.provider ||
      groupCoverValue?.platformName ||
      groupCoverValue?._id;

    const providerLabel =
      safeProviderOptions.find((option) => option?.value === providerId)
        ?.label ||
      groupCoverValue?.platformName ||
      providerId ||
      "--";

    let IP =
      groupCoverValue?.groupInsuranceDetails?.monthlyIncome &&
      groupCoverValue?.groupInsuranceDetails?.monthlyIncome !== "$0"
        ? (groupCoverValue?.groupInsuranceDetails?.monthlyIncome || "$0") +
          "/" +
          (groupCoverValue?.groupInsuranceDetails?.waitingPeriod || "30") +
          " Days/" +
          (groupCoverValue?.groupInsuranceDetails?.BenefitPeriod || "2 Years")
        : "$0";

    return [
      {
        key: "group-insurance",
        index: 1,
        provider: providerLabel,
        policyNo:
          groupCoverValue?.policyNo || groupCoverValue?.memberNumber || "",
        groupOwner:
          groupCoverValue?.groupOwner ||
          groupCoverValue?.owner ||
          "Super Trustee",
        life:
          groupCoverValue?.life ||
          groupCoverValue?.groupInsuranceDetails?.lifeCover ||
          "$0",
        TPD:
          groupCoverValue?.TPD ||
          groupCoverValue?.groupInsuranceDetails?.TPDCover ||
          "$0",
        IP: IP || "$0",
        premiumPA:
          groupCoverValue?.premiumPA ||
          groupCoverValue?.groupInsuranceDetails?.cost ||
          "$0",
        loadingExclusion: groupCoverValue?.loadingExclusion || "No",
      },
    ];
  }, [groupCoverValue, providerOptions]);

  const columns = useMemo(() => {
    return [
      {
        title: "No#",
        dataIndex: "index",
        key: "index",
        width: 60,
      },
      {
        title: "Provider",
        dataIndex: "provider",
        key: "provider",
        placeholder: "Provider",
      },
      {
        title: "Policy no",
        dataIndex: "policyNo",
        key: "policyNo",
        type: "text",
        placeholder: "Policy No",
      },
      {
        title: "Owner",
        dataIndex: "groupOwner",
        key: "groupOwner",
      },
      {
        title: "Life",
        dataIndex: "life",
        key: "life",
      },
      {
        title: "TPD",
        dataIndex: "TPD",
        key: "TPD",
      },
      {
        title: "IP",
        dataIndex: "IP",
        key: "IP",
      },
      {
        title: "Premium $ p.a",
        dataIndex: "premiumPA",
        key: "premiumPA",
      },
      {
        title: "Loading/ Exclusion",
        dataIndex: "loadingExclusion",
        key: "loadingExclusion",
      },
    ];
  }, []);

  return (
    <Row gutter={16} style={{ padding: "16px 4px 0px 4px" }}>
      <Col xs={24} md={24}>
        <DynamicDataTable columns={columns} data={rows} {...TABLE_PROPS} />
      </Col>
    </Row>
  );
}
