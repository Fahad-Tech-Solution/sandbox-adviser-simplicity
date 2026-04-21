import { Button, Input, Space } from "antd";
import Text from "antd/es/typography/Text";
import Title from "antd/es/typography/Title";
import React, { useState } from "react";
import { useSetAtom } from "jotai";
import { MyClientsData } from "../../../../store/authState";
import {
  mergeNewClientRowForTable,
  normalizeMyClientsList,
  wrapMyClientsState,
} from "../../../../hooks/helpers";
import AddClient from "./components/AddClient";
import HouseholdTable from "./HouseholdTable";

const MyClients = () => {
  const [searchText, setSearchText] = useState("");
  const [openAddClient, setOpenAddClient] = useState(false);
  const setMyClientsData = useSetAtom(MyClientsData);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Text
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: 3,
              color: "#22c55e",
              textTransform: "uppercase",
              marginBottom: 6,
              fontWeight: 400,
            }}
          >
            Admin
          </Text>
          <Title
            style={{
              margin: 0,
              fontFamily: "Georgia,serif",
              fontWeight: 500,
              fontSize: 28,
            }}
          >
            My Clients
          </Title>
        </div>
        <div className="">
          <Space size={10}>
            <Input
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              //   prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              prefix={"🔍"}
              style={{ width: 210, borderRadius: 7 }}
            />
            <Button
              type="primary"
              style={{
                borderRadius: 8,
                fontWeight: 700,
                padding: "17px 20px",
                fontSize: 13,
              }}
              onClick={() => {
                setOpenAddClient(true);
              }}
            >
              Add New +
            </Button>
          </Space>
        </div>
      </div>

      <AddClient
        open={openAddClient}
        onClose={() => setOpenAddClient(false)}
        onSuccess={(res, formValues) => {
          const row = mergeNewClientRowForTable(res, formValues);
          if (!row) return;
          setMyClientsData((prev) => {
            const list = normalizeMyClientsList(prev);
            return wrapMyClientsState([row, ...list]);
          });
        }}
      />

      <HouseholdTable searchText={searchText} />
    </div>
  );
};

export default MyClients;
