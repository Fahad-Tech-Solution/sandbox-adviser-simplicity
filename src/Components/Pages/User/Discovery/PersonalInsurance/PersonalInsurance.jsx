import { useAtomValue } from "jotai";
import React, { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import { matchDiscoveryRoute } from "../../../../Routes/User.Routes";
import { Col, Row } from "antd";
import DiscoveryTotalsCard from "../../../../Common/DiscoveryTotalsCard.jsx";
import AppModal from "../../../../Common/AppModal.jsx";
import { renderModalContent } from "../../../../Common/renderModalContent.jsx";

const EMPTY_STYLE = {
  minHeight: 360,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "32px 16px",
};

const EMPTY_ICON_STYLE = { fontSize: 56, color: "#111827", marginBottom: 12 };

const EMPTY_TITLE_STYLE = {
  fontSize: 18,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 8,
};

const EMPTY_SUBTITLE_STYLE = {
  fontSize: 14,
  color: "#94a3b8",
};

const PersonalInsurance = () => {
  const location = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const currentRoute = useMemo(
    () => matchDiscoveryRoute(location.pathname, discoveryQuestions),
    [discoveryQuestions, location.pathname],
  );

  const personalInsuranceData = discoveryData?.personalInsurance || null;
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName || "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName || "Partner";

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const visibleCards = useMemo(
    () =>
      (currentRoute?.Cards || []).filter((card) => {
        const isYes = discoveryQuestions[card.key] === "Yes";
        return isYes || card?.alwaysShow;
      }),
    [currentRoute?.Cards, discoveryQuestions],
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleOpenModal = useCallback(
    (nextModalData) => {
      if (!nextModalData) return;
      setModalData({
        ...nextModalData,
        closeModal: handleCloseModal,
      });
      setModalOpen(true);
    },
    [handleCloseModal],
  );

  const cardViewModels = useMemo(
    () =>
      visibleCards.map((card) => ({
        key: card.key,
        title: card.title,
        icon: card.icon,
        firstName: card?.firstNameKey || clientName,
        firstTotal:
          personalInsuranceData?.[card?.firstTotalKey || "clientTotal"],
        secondName: card?.secondNameKey || partnerName,
        secondTotal:
          personalInsuranceData?.[card?.secondTotalKey || "partnerTotal"],
        showPartner: card?.showSecondTotal || showPartner,
        modalPayload: {
          title: card.title,
          component: card.component,
          icon: card.icon,
          key: card.key,
          width: card?.modalWidth || 1000,
          innerComponent: card?.innerComponent || null,
          tableRows: card?.tableRows || 10,
        },
      })),
    [clientName, partnerName, personalInsuranceData, showPartner, visibleCards],
  );

  const modalContent = useMemo(() => renderModalContent(modalData), [modalData]);

  return (
    <div>
      <AppModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={"Personal Insurance"}
        width={modalData?.width}
      >
        {modalContent}
      </AppModal>

      {cardViewModels.length === 0 ? (
        <div style={EMPTY_STYLE}>
          <div>
            <span style={EMPTY_ICON_STYLE}>+</span>
            <div style={EMPTY_TITLE_STYLE}>No items selected</div>
            <div style={EMPTY_SUBTITLE_STYLE}>
              Click the + button above to add personal insurance items
            </div>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {cardViewModels.map((card) => (
            <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
              <DiscoveryTotalsCard
                title={card.title}
                icon={card.icon}
                firstName={card.firstName}
                firstTotal={card.firstTotal}
                secondName={card.secondName}
                secondTotal={card.secondTotal}
                showPartner={card.showPartner}
                modalPayload={card.modalPayload}
                onOpenModal={handleOpenModal}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default PersonalInsurance;
