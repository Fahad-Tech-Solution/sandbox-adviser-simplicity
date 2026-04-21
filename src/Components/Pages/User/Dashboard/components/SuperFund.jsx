import { useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import DynamicDataTable from "../../../../Common/DynamicDataTable";

export default function SuperFund({ form, editMode }) {
  const [rows, setRows] = useState([
    {
      key: "1",
      owner: "peter",
      currentBalance: "$1,200,000",
    },
    {
      key: "2",
      owner: "rhonda",
      currentBalance: "$1,200,000",
    },
  ]);

  const updateRow = (key, patch) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const columns = [
    {
      title: "Owner",
      dataIndex: "owner",
      key: "owner",
      width: 180,
      render: (value, record) =>
        editMode ? (
          <Select
            value={value}
            style={{ width: "100%" }}
            options={[
              { label: "Peter", value: "peter" },
              { label: "Rhonda", value: "rhonda" },
            ]}
            onChange={(next) => updateRow(record.key, { owner: next })}
          />
        ) : (
          value
        ),
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      width: 220,
      render: (value, record) =>
        editMode ? (
          <Input
            value={value}
            onChange={(e) =>
              updateRow(record.key, { currentBalance: e.target.value })
            }
          />
        ) : (
          value
        ),
    },
    {
      title: "",
      key: "action",
      width: 90,
      render: () => (
        <Button
          type="primary"
          shape="circle"
          size="small"
          icon={<ArrowUpOutlined style={{ fontSize: 12 }} />}
          style={{
            background: "#22c55e",
            borderColor: "#22c55e",
            boxShadow: "none",
          }}
        />
      ),
    },
  ];

  const onFinish = (values) => {
    console.log("form values", values);
  };

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <DynamicDataTable
          columns={columns}
          data={rows}
          total={rows.length}
          pageSize={10}
          bordered
          size="small"
          showCount={false}
          tableStyle={{
            borderRadius: 14,
            overflow: "hidden",
          }}
          tableProps={{
            pagination: false,
          }}
        />
      </Form>
    </div>
  );
}
