import React, { cloneElement, isValidElement } from "react";
import { Empty } from "antd";

export function renderModalContent(modalData) {
  if (!modalData?.component) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="No data found" />
      </div>
    );
  }

  if (isValidElement(modalData.component)) {
    return cloneElement(modalData.component, { modalData });
  }

  if (typeof modalData.component === "function") {
    const ModalComponent = modalData.component;
    return <ModalComponent modalData={modalData} />;
  }

  return modalData.component;
}
