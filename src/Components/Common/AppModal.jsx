import { Button, Divider, Modal, Typography } from "antd";

const { Text, Title } = Typography;

export default function AppModal({
  open,
  onClose = () => {},
  title = "",
  subtitle,
  icon,
  width = 1100,
  titleWeight = 600,
  titleSize = 20,
  children,
  footer = null,
  className = "",
  centered = true,
  blur = true,
  destroyOnClose = true,
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        onClose();
      }}
      width={width}
      centered={centered}
      footer={footer}
      mask={{ enabled: true, blur: blur, closable: false }}
      destroyOnHidden={destroyOnClose} // ❗ new prop
      className={`${className}`.trim()}
      styles={{
        container: {
          borderRadius: 16,
        },
        title: {
          fontFamily: "Georgia,serif",
          fontWeight: titleWeight,
          fontSize: titleSize,
        },
      }}
    >
      {title && <Divider style={{ margin: 0 }} />}
      {children}
    </Modal>
  );
}
