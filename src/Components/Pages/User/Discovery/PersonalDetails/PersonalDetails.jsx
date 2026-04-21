import { DownloadOutlined, RightOutlined } from "@ant-design/icons";
import { App as AntdApp, Button, Card, Col, Row, Typography } from "antd";
import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  SelectedClient,
} from "../../../../../store/authState";
import { getNextDiscoveryNavKey } from "../../../../Routes/User.Routes.jsx";
import { PRIMARY_GREEN, ProfileCard } from "./components/ProfileCard.jsx";
import PersonalDetailsFrom from "./components/PersonalDetailsFrom.jsx";

const { Text } = Typography;

/**
 * `GET /api/dataOfAllSection/:id` may nest personal details or return them at the root.
 */
function getPersonalDetailsFromDiscovery(data) {
  if (!data || typeof data !== "object") return null;
  if (data.personaldetails && typeof data.personaldetails === "object") {
    return data.personaldetails;
  }
  if (data.personalDetails && typeof data.personalDetails === "object") {
    return data.personalDetails;
  }
  if (
    data.client != null &&
    (data._id || data.client?.clientGivenName != null)
  ) {
    return data;
  }
  return null;
}

export function PersonalDetails() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const selected = useAtomValue(SelectedClient);
  const [step, setStep] = useState(1);

  const pd = getPersonalDetailsFromDiscovery(discoveryData);

  const client = pd?.client ?? selected?.client ?? {};
  const partner = pd?.partner ?? selected?.partner ?? {};

  const clientImageUrl = client?.image?.url;
  const partnerImageUrl = partner?.image?.url;

  const hasSelection = Boolean(selected?._id);
  const nextPath = getNextDiscoveryNavKey(pathname, discoveryQuestions);

  return (
    <>
      {!hasSelection ? (
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Text type="secondary">
            Select a client from <strong>My Clients</strong> (gear menu →
            Select) to view personal details here.
          </Text>
        </Card>
      ) : (
        <>
          {step === 2 && (
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <PersonalDetailsFrom
                  discoveryData={discoveryData}
                  onBack={() => setStep(1)}
                  onNext={() => nextPath && navigate(nextPath)}
                  onSave={(saved) => {
                    setStep(1);
                  }}
                />
              </Col>
            </Row>
          )}

          {step === 1 && (
            <Row gutter={[24, 24]} align={"stretch"}>
              <Col xs={24} md={12} style={{ display: "flex", alignItems: "stretch" }}>
                <ProfileCard
                  person={client}
                  role="client"
                  imageUrl={clientImageUrl}
                  personalDetailsId={pd?._id}
                />
              </Col>
              <Col xs={24} md={12}>
                <ProfileCard
                  person={partner}
                  role="partner"
                  imageUrl={partnerImageUrl}
                  personalDetailsId={pd?._id}
                />
              </Col>
            </Row>
          )}
        </>
      )}

      {step === 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button
              onClick={() => (step === 1 ? setStep(2) : setStep(1))}
              style={{ borderRadius: 8, minWidth: 96 }}
            >
              View
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                message.info("Download — connect when export API is ready.")
              }
              style={{ borderRadius: 8, minWidth: 140 }}
            >
              Download Doc
            </Button>
          </div>
          <Button
            type="primary"
            disabled={!nextPath}
            onClick={() => nextPath && navigate(nextPath)}
            style={{
              borderRadius: 8,
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            Next <RightOutlined />
          </Button>
        </div>
      )}
    </>
  );
}

export default PersonalDetails;
