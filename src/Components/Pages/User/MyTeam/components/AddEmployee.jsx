import { useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Col, Form, Input, Row, Select } from "antd";
import { useAtomValue } from "jotai";
import AppModal from "../../../../Common/AppModal";
import { loggedInUser } from "../../../../../store/authState";
import useApi from "../../../../../hooks/useApi";

const FORM_ID = "add-employee-form";

function normalizeRolesResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.roles)) return data.roles;
  return [];
}

function roleIdFromRow(row) {
  if (!row?.roleID) return undefined;
  if (typeof row.roleID === "object") return row.roleID._id ?? row.roleID.id;
  return row.roleID;
}

/**
 * Add / edit employee modal — same fields / endpoints as legacy EmployeeForm.
 * POST /api/user/Add/Employee | PATCH /api/user/Update/Employee
 *
 * @param {object|null} editingEmployee — when set, form opens in edit mode for that row.
 */
export default function AddEmployee({
  open,
  onClose,
  onSuccess,
  editingEmployee = null,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const session = useAtomValue(loggedInUser);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const companyName = session?.user?.companyName ?? "";

  const isEdit = Boolean(editingEmployee?._id);

  const editingKey = editingEmployee?._id ?? null;

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      const row = editingEmployee;
      form.setFieldsValue({
        firstName: row.firstName ?? "",
        lastName: row.lastName ?? "",
        email: row.email ?? "",
        phoneNumber: row.phoneNumber ?? "",
        companyName: row.companyName ?? companyName,
        roleID: roleIdFromRow(row),
      });
    } else {
      form.setFieldsValue({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        companyName,
        roleID: undefined,
      });
    }

    let cancelled = false;
    (async () => {
      setLoadingRoles(true);
      try {
        const data = await api.get("/api/role");
        if (!cancelled) setRoles(normalizeRolesResponse(data));
      } catch {
        if (!cancelled) {
          setRoles([]);
          message.error("Could not load roles.");
        }
      } finally {
        if (!cancelled) setLoadingRoles(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, editingKey, isEdit, api, form, companyName, message]);

  const handleFinish = async (values) => {
    const base = {
      ...values,
      companyName: companyName || values.companyName,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          ...base,
          _id: editingEmployee._id,
          ...(editingEmployee.parentUserID !== undefined && {
            parentUserID: editingEmployee.parentUserID,
          }),
        };
        const res = await api.patch("/api/user/Update/Employee", payload);
        message.success("Employee updated.");
        const merged =
          res && typeof res === "object"
            ? res
            : { ...editingEmployee, ...base, _id: editingEmployee._id };
        onSuccess?.(merged, { isEdit: true });
      } else {
        const res = await api.post("/api/user/Add/Employee", base);
        message.success("Employee added.");
        onSuccess?.(res, { isEdit: false });
      }
      form.resetFields();
      onClose?.();
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = useMemo(
    () =>
      roles.map((item) => ({
        value: item._id,
        label: item.roleName ?? item.name ?? String(item._id),
      })),
    [roles],
  );

  const modalTitle = isEdit ? "Edit Employee" : "Add Employee";
  const submitLabel = isEdit ? "Save changes" : "Add Employee";

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={modalTitle}
      width={560}
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={submitting}
            style={{ background: "#22c55e", borderColor: "#22c55e" }}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "Enter first name" }]}
            >
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Enter last name" }]}
            >
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Enter email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input placeholder="Email Address" autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="phoneNumber" label="Phone Number">
              <Input placeholder="Phone Number" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="companyName" label="Company Name">
              <Input placeholder="Company Name" disabled readOnly />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="roleID"
              label="Role"
              rules={[{ required: true, message: "Select a role" }]}
            >
              <Select
                placeholder="Role"
                options={roleOptions}
                showSearch
                optionFilterProp="label"
                loading={loadingRoles}
                disabled={isEdit}
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AppModal>
  );
}
