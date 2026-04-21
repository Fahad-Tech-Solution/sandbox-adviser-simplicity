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

const IncomeExpenses = () => {
  const location = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);

  const headingStyle = { fontFamily: "Georgia,serif" };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });

  const { patch, post } = useApi();

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

  const SubmitRegularLivingExpensesModal = async (data, key) => {
    if (key !== "incomeFromRegularLivingExpenses") {
      return;
    }

    try {
      const existing = discoveryData.retirementLivingExpenses;
      const isUpdate = existing && typeof existing === "object" && existing._id;

      const payload = {
        _id: isUpdate ? existing._id : undefined,
        retirementLivingExpense: data,
        clientFK: discoveryData.personalDetails?._id,
      };

      let response;

      if (isUpdate) {
        response = await patch(`/api/retirementLivingExpenses/Update`, payload);
      } else {
        response = await post(`/api/retirementLivingExpenses/Add`, payload);
      }

      // console.log(response);

      if (response) {
        setDiscoveryData((prev) => {
          return {
            ...prev,
            retirementLivingExpenses: response,
          };
        });
        message.success("Regular living expenses updated successfully");
      } else {
        message.error("Failed to update regular living expenses");
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit regular living expenses",
      );
      console.error(error);
    }
  };

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

      <Row gutter={[16, 16]}>
        {CurrentRoute?.Cards?.map((card) => {
          const isYes = discoveryQuestions[card.key] === "Yes";
          if (isYes || card?.alwaysShow) {
            return (
              <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
                <DiscoveryTotalsCard
                  title={card.title}
                  icon={card.icon}
                  firstName={
                    card?.firstNameKey ||
                    discoveryData.personalDetails?.client?.clientPreferredName
                  }
                  firstTotal={
                    discoveryData?.[
                      card.key == "incomeFromRegularLivingExpenses"
                        ? "generalLivingExpenses"
                        : card.key
                    ]?.[card?.firstTotalKey || "clientTotal"]
                  }
                  secondName={
                    card?.secondNameKey ||
                    discoveryData.personalDetails?.partner?.partnerPreferredName
                  }
                  secondTotal={
                    discoveryData?.[
                      card.key == "incomeFromRegularLivingExpenses"
                        ? "retirementLivingExpenses"
                        : card.key
                    ]?.[card?.secondTotalKey || "partnerTotal"]
                  }
                  showPartner={card?.showSecondTotal || showPartner}
                  secondisFormInput={card?.secondisFormInput}
                  callBackFunction={async (data) => {
                    // Submit Regular Living Expenses Modal
                    await SubmitRegularLivingExpensesModal(data, card.key);
                  }}
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
            );
          }
          return null;
        })}
      </Row>
    </div>
  );
};

export default IncomeExpenses;
