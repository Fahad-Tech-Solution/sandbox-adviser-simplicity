import React, { useState } from "react";
import AdviceGoalCard from "../../../../Common/AdviceGoalCard";
import { Button, Col, Divider, message, Row } from "antd";
import {
  discoverySectionQuestionsAtom,
  SelectedClient,
} from "../../../../../store/authState";
import { useAtom, useAtomValue } from "jotai";
import useApi from "../../../../../hooks/useApi";

const CardsSelection = ({ Cards, setModalOpen }) => {
  const [discoveryQuestions, setDiscoveryQuestions] = useAtom(
    discoverySectionQuestionsAtom,
  );
  const [questionTemp, setQuestionTemp] = useState(discoveryQuestions);

  const selectedClient = useAtomValue(SelectedClient);

  const onClick = (key) => {
    // setDiscoveryQuestions((prev) => ({
    //   ...prev,
    //   [key]: "Yes" === discoveryQuestions[key] ? "No" : "Yes",
    // }));

    // console.log(key);
    // console.log(questionTemp);

    setQuestionTemp((prev) => ({
      ...prev,
      [key]: "Yes" === questionTemp[key] ? "No" : "Yes",
    }));
  };

  const { post, patch } = useApi();

  const SubmitFunction = async () => {
    try {
      let payload = {
        clientFK: selectedClient?._id,
        ...discoveryQuestions,
        ...questionTemp,
      };

      if (discoveryQuestions?.clientFK) {
        const response = await patch(
          `/api/questions/Update/${discoveryQuestions.clientFK}`,
          payload,
        );
        console.log(response);
      } else {
        const response = await post("/api/questions/Add", payload);
        console.log(response);
      }

      setDiscoveryQuestions(payload);

      setModalOpen(false);
      message.success("Discovery questions updated successfully");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px 0 0 0" }}>
      <Row gutter={[16, 16]} justify="center">
        {Cards.map((card) => {
          if (!card?.alwaysShow) {
            return (
              <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
                <AdviceGoalCard
                  label={card.title}
                  Icon={card.icon}
                  status={questionTemp[card.key] || "No"}
                  key={card.key}
                  info={card.info}
                  onClick={() => {
                    onClick(card.key);
                  }}
                />
              </Col>
            );
          }
          return null;
        })}
      </Row>
      <Divider />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" onClick={SubmitFunction}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default CardsSelection;
