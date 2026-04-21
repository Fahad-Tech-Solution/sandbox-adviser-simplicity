import { useMemo, useState } from "react";
import {
  AppstoreOutlined,
  DollarOutlined,
  HomeOutlined,
  MenuOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Drawer,
  Layout,
  Menu,
  Typography,
  Grid,
  Avatar,
  ConfigProvider,
} from "antd";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import logo from "../../assets/image/Adviser-Simpilicity1.png";
import {
  allUserRoutes,
  DISCOVERY_ADD_SECTION_KEY,
  discoveryRoutes,
  strategyRoutes,
  userRoutes,
  withSpacing,
} from "../Routes/User.Routes.jsx";
import DiscoveryFlowLayout from "./DiscoveryFlowLayout.jsx";
import AddDiscoverySectionsModal from "../Pages/User/Discovery/AddSection/AddDiscoverySections.jsx";
import { useAtomValue, useSetAtom } from "jotai";
import {
  addDiscoverySectionsModalOpen,
  loggedInUser,
} from "../../store/authState.js";
import useUserDashboardData from "../../hooks/useUserDashboardData";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
import { discoverySectionQuestionsAtom } from "../../store/authState.js";

export default function UserLayout() {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const session = useAtomValue(loggedInUser);
  const navigate = useNavigate();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const setAddDiscoveryModalOpen = useSetAtom(addDiscoverySectionsModalOpen);

  const navItems = useMemo(() => {
    const passes = (route) => route.condition?.(discoveryQuestions) !== false;
    // `!== false` keeps routes with no `condition` visible; use `=== true` if you require condition
    return [
      ...userRoutes.filter(passes),
      {
        key: "discovery",
        ...withSpacing({ icon: "⚙️", label: "Discovery", fontSize: "13px" }),
        children: discoveryRoutes.filter(passes),
      },
      {
        key: "strategy",
        ...withSpacing({ icon: "📋", label: "Strategy", fontSize: "13px" }),
        children: strategyRoutes.filter(passes),
      },
    ];
  }, [discoveryQuestions]);

  useUserDashboardData({
    enabled: Boolean(session?.token),
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = useMemo(() => {
    const all = [
      ...navItems.flatMap((item) => [item, ...(item.children || [])]),
    ];
    const found =
      all.find((item) => location.pathname === item.key) ||
      all.find((item) => location.pathname.startsWith(item.key));
    return found?.key || "/user";
  }, [location.pathname]);

  const visibleRoutes = useMemo(() => {
    return allUserRoutes;
  }, []);

  const handleMenuClick = (info) => {
    if (info.key === DISCOVERY_ADD_SECTION_KEY) {
      setAddDiscoveryModalOpen(true);
      return;
    }
    if (info.key.startsWith("/")) {
      navigate(info.key);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          width={220}
          height="100vh"
          style={{
            background: "#fff",
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <div className="d-flex flex-column h-100">
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "100px" }}
            >
              <img
                src={logo}
                alt="logo"
                className="img-fluid"
                style={{ width: "75%", height: "auto", objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                maxHeight: screens.xl
                  ? "calc(100vh - 16.9vh)"
                  : "calc(100vh - 27vh)",
                overflowY: "auto",
              }}
              // style={{ flex: 1, overflowY: "auto" }}
            >
              <ConfigProvider
                theme={{
                  components: {
                    Menu: {
                      fontSize: 12,
                      subMenuItemBg: "#fff",
                    },
                  },
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={[selectedKey]}
                  items={navItems}
                  inlineIndent={12}
                  style={{ borderRight: 0 }}
                  styles={{
                    item: { padding: "0px 10px", height: "35px" },
                    subMenu: {
                      item: {
                        padding: "0px 20px",
                        height: "35px",
                      },
                    },
                  }}
                  onClick={(info) => handleMenuClick(info)}
                />
              </ConfigProvider>
            </div>

            {/* User Profile Section */}
            <div
              style={{
                marginTop: "auto",
                padding: "15px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
              onClick={() => console.log("Profile clicked", session)}
            >
              <Avatar
                size={35}
                src={session?.user?.profileImage}
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e, rgb(22, 163, 74))",
                  color: "#fff",
                }}
              >
                {!session?.user?.profileImage &&
                  session?.user?.firstName?.charAt(0) +
                    session?.user?.lastName?.charAt(0)}
              </Avatar>

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 500 }}>
                  {session?.user?.firstName + " " + session?.user?.lastName ||
                    "John Doe"}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {session?.user?.email || "john.doe@example.com"}
                </div>
              </div>
            </div>
          </div>
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <>
          <Drawer
            title={
              <span style={{ fontFamily: "Georgia, serif" }}>Navigation</span>
            }
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
          >
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              items={navItems}
              onClick={(info) => {
                handleMenuClick(info);
                setDrawerOpen(false);
              }}
            />
          </Drawer>

          {/* Mobile drawer button */}
          <div
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 1000,
              background: "#fff",
              borderRadius: 8,
              padding: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuOutlined />
          </div>
        </>
      )}

      {/* Content */}
      <Layout>
        <Content
          style={{
            background: "#fff",
            height: "100vh",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 8,
              maxWidth: screens.lg ? "1100px" : "100%",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto",
            }}
          >
            <Routes>
              {visibleRoutes.map((r) => (
                <Route
                  key={r.key}
                  path={r.path}
                  element={r.component ?? <Navigate to="/user" replace />}
                />
              ))}
              <Route path="discovery" element={<DiscoveryFlowLayout />}>
                <Route
                  index
                  element={<Navigate to="client-summary" replace />}
                />
                {discoveryRoutes
                  .filter((r) => !r.modalOnly)
                  .map((r) => (
                    <Route
                      key={r.key}
                      path={r.relativePath}
                      element={
                        r.component ?? <Navigate to="/user" replace />
                      }
                    />
                  ))}
              </Route>
            </Routes>
          </div>
        </Content>
      </Layout>
      <AddDiscoverySectionsModal />
    </Layout>
  );
}
