import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Space,
  Typography,
  Upload,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import imageCompression from "browser-image-compression";
import { useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import useApi from "../../../../../../hooks/useApi";
import { discoveryDataAtom } from "../../../../../../store/authState";

const { Dragger } = Upload;
const { Text, Title } = Typography;

const CARD_SIZE = 96;
const boyImages = import.meta.glob(
  "../../../../../../assets/image/ProfileImages/avatar-boy-*.png",
  {
    eager: true,
    import: "default",
  },
);
const girlImages = import.meta.glob(
  "../../../../../../assets/image/ProfileImages/avatar-girl-*.png",
  {
    eager: true,
    import: "default",
  },
);
const avatarBoys = Object.keys(boyImages)
  .sort()
  .map((key, index) => ({
    key: `client-${index}`,
    url: boyImages[key],
  }));
const avatarGirls = Object.keys(girlImages)
  .sort()
  .map((key, index) => ({
    key: `partner-${index}`,
    url: girlImages[key],
  }));

function buildPresetAvatars(owner) {
  return owner === "partner" ? avatarGirls : avatarBoys;
}

function normalizeImageResult(result, fallbackUrl) {
  if (result?.image && typeof result.image === "object") {
    return result.image;
  }
  if (result?.image && typeof result.image === "string") {
    return { url: result.image, public_id: "" };
  }
  if (fallbackUrl) {
    return { url: fallbackUrl, public_id: "" };
  }
  return null;
}

function updateDiscoveryImage(prev, owner, image) {
  if (!prev || typeof prev !== "object") {
    return prev;
  }

  const applyOwnerImage = (target) => ({
    ...target,
    [owner]: {
      ...(target?.[owner] || {}),
      image,
    },
  });

  if (prev.personaldetails && typeof prev.personaldetails === "object") {
    return {
      ...prev,
      personaldetails: applyOwnerImage(prev.personaldetails),
    };
  }

  if (prev.personalDetails && typeof prev.personalDetails === "object") {
    return {
      ...prev,
      personalDetails: applyOwnerImage(prev.personalDetails),
    };
  }

  if (prev.client || prev.partner) {
    return applyOwnerImage(prev);
  }

  return prev;
}

/**
 * Upload/select avatar image for personal details profile cards.
 * Uses legacy personal-details image endpoints while keeping current Jotai state in sync.
 */
export default function UploadImage({
  personalDetailsId,
  owner = "client",
  currentImage = "",
  onSuccess,
  onClose,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const presetAvatars = useMemo(() => buildPresetAvatars(owner), [owner]);

  useEffect(() => {
    setSelectedFile(null);
    setSelectedPreset("");
    setError("");
  }, [currentImage, owner, personalDetailsId]);

  const previewUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (selectedPreset) {
      return selectedPreset;
    }
    return currentImage || "";
  }, [currentImage, selectedFile, selectedPreset]);

  useEffect(() => {
    return () => {
      if (selectedFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  const fileList = useMemo(
    () =>
      selectedFile
        ? [
            {
              uid: "selected-image",
              name: selectedFile.name,
              status: "done",
              originFileObj: selectedFile,
            },
          ]
        : [],
    [selectedFile],
  );

  const handleBeforeUpload = (file) => {
    setSelectedFile(file);
    setSelectedPreset("");
    setError("");
    return false;
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setSelectedPreset("");
    setError("");
  };

  const handlePresetSelect = (url) => {
    setSelectedFile(null);
    setSelectedPreset(url);
    setError("");
  };

  const handleSave = async () => {
    if (!personalDetailsId) {
      message.error("Personal details record is not loaded yet.");
      return;
    }

    if (!selectedFile && !selectedPreset) {
      message.info("Choose an image or avatar first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let result;
      let fallbackUrl = selectedPreset || previewUrl;

      if (selectedPreset) {
        result = await api.patch(
          `/api/personalDetails/updateAvatar/${personalDetailsId}`,
          {
            image: selectedPreset,
            type: owner,
          },
        );
      } else if (selectedFile) {
        let fileToUpload = selectedFile;

        if (fileToUpload.size > 1024 * 1024) {
          fileToUpload = await imageCompression(fileToUpload, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          });
        }

        const formData = new FormData();
        formData.append("image", fileToUpload);
        formData.append("type", owner);

        result = await api.patch(
          `/api/personalDetails/updateImage/${personalDetailsId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      const nextImage = normalizeImageResult(result, fallbackUrl);

      if (nextImage) {
        setDiscoveryData((prev) =>
          updateDiscoveryImage(prev, owner, nextImage),
        );
        onSuccess?.(nextImage);
      }

      message.success("Profile image updated.");
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Could not update image.";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <Avatar
            src={previewUrl || undefined}
            size={120}
            style={{
              background: "#f3f4f6",
              border: "3px solid rgba(34,197,94,.2)",
            }}
          />
        </div>

        <div>
          <Title level={5} style={{ marginTop: 0, marginBottom: 10 }}>
            Upload Image
          </Title>
          <Dragger
            accept="image/*"
            multiple={false}
            beforeUpload={handleBeforeUpload}
            showUploadList={false}
            fileList={fileList}
            onRemove={handleRemove}
            disabled={loading}
            style={{ borderRadius: 12 }}
          >
            <p style={{ marginBottom: 8 }}>
              <UploadOutlined style={{ fontSize: 28, color: "#22c55e" }} />
            </p>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>
              Click or drag image to upload
            </p>
            <Text type="secondary">PNG, JPG, WEBP supported</Text>
          </Dragger>
        </div>

        <div>
          <Title level={5} style={{ marginTop: 20, marginBottom: 10 }}>
            Choose Avatar
          </Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {presetAvatars.map((avatar) => {
              const active = selectedPreset === avatar.url;
              return (
                <div
                  role="button"
                  key={avatar.key}
                  onClick={() => handlePresetSelect(avatar.url)}
                  style={{
                    borderRadius: "50%",
                    background: "#fff",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={avatar.url}
                    alt="Preset avatar"
                    style={{
                      border: active ? "2px solid #22c55e" : "none",
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {error ? <Alert type="error" showIcon message={error} /> : null}

        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            disabled={loading}
          >
            Clear
          </Button>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSave}
            loading={loading}
            style={{ background: "#22c55e", borderColor: "#22c55e" }}
          >
            Save Image
          </Button>
        </Space>
      </div>
    </div>
  );
}
