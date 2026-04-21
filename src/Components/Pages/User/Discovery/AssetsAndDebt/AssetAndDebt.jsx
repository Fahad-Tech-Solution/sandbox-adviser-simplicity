import { PlusOutlined } from "@ant-design/icons";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import {
  getDiscoveryStepperRoutes,
  pathMatchesDiscoveryRoute,
} from "../../../../Routes/User.Routes";
import { Col, message, Row } from "antd";
import DiscoveryTotalsCard from "../../../../Common/DiscoveryTotalsCard.jsx";
import useApi from "../../../../../hooks/useApi.js";
import AppModal from "../../../../Common/AppModal.jsx";
import { renderModalContent } from "../../../../Common/renderModalContent.jsx";
import useTitleBlock from "../../../../../hooks/useTitleBlock.jsx";

const AssetAndDebt = () => {
  const location = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);

  const headingStyle = { fontFamily: "Georgia,serif" };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });

  const stepperRoutes = useMemo(
    () => getDiscoveryStepperRoutes(discoveryQuestions),
    [discoveryQuestions],
  );

  const CurrentRoute = useMemo(
    () =>
      stepperRoutes.find((r) =>
        pathMatchesDiscoveryRoute(location.pathname, r),
      ),
    [location.pathname, stepperRoutes],
  );

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData.personalDetails?.client?.clientMaritalStatus,
  );

  const visibleCards = useMemo(
    () =>
      (CurrentRoute?.Cards || []).filter((card) => {
        const isYes = discoveryQuestions[card.key] === "Yes";
        return isYes || card?.alwaysShow;
      }),
    [CurrentRoute?.Cards, discoveryQuestions],
  );

  return (
    <div>
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={renderTitleBlock({
          title: modalData?.title,
          icon: modalData?.icon,
        })}
        width={modalData?.width}
      >
        {renderModalContent(modalData)}
      </AppModal>

      {visibleCards.length === 0 ? (
        <div
          style={{
            minHeight: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "32px 16px",
          }}
        >
          <div>
            <span style={{ fontSize: 56, color: "#111827", marginBottom: 12 }}>
              ➕
            </span>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 8,
              }}
            >
              No items selected
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#94a3b8",
              }}
            >
              Click the + button above to add assets and debt items
            </div>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {visibleCards.map((card) => (
            <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
              <DiscoveryTotalsCard
                title={card.title}
                icon={card.icon}
                firstName={
                  [
                    "houseHold",
                    "boat",
                    "caravan",
                    "otherAssets",
                    "personalLoans",
                    "creditCards",
                  ].includes(card.key)
                    ? !showPartner
                      ? discoveryData.personalDetails?.client
                          ?.clientPreferredName
                      : "Joint"
                    : card?.firstNameKey ||
                      discoveryData.personalDetails?.client?.clientPreferredName
                }
                firstTotal={
                  discoveryData?.[card?.key]?.[
                    card?.firstTotalKey || "clientTotal"
                  ]
                }
                secondName={
                  card?.secondNameKey ||
                  discoveryData.personalDetails?.partner?.partnerPreferredName
                }
                secondTotal={
                  discoveryData?.[card.key]?.[
                    card?.secondTotalKey || "partnerTotal"
                  ]
                }
                showPartner={
                  [
                    "houseHold",
                    "boat",
                    "caravan",
                    "otherAssets",
                    "personalLoans",
                    "creditCards",
                  ].includes(card.key)
                    ? card?.showSecondTotal
                    : card?.showSecondTotal || showPartner
                }
                OpenModal={() => {
                  setModalOpen(true);
                  setModalData({
                    title: card.title,
                    component: card.component,
                    icon: card.icon,
                    key: card.key,
                    width: card?.modalWidth || 1000,
                    closeModal: () => setModalOpen(false),
                  });
                }}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default AssetAndDebt;
