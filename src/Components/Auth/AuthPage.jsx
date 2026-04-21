import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgetPasswordForm from "./ForgetPasswordForm";

export default function AuthPage() {
  const location = useLocation();
  const flipControls = useAnimation();

  useEffect(() => {
    let mounted = true;

    const playFlip = async () => {
      await flipControls.set({ rotateY: -14 });
      if (!mounted) return;
      await flipControls.start({
        rotateY: 0,
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      });
    };

    playFlip();
    return () => {
      mounted = false;
    };
  }, [location.pathname, flipControls]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 980, perspective: 1400 }}>
        <motion.div
          initial={false}
          animate={flipControls}
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            transformStyle: "preserve-3d",
            minHeight:
              location.pathname === "/auth/forget-password" ? 350 : 440,
            willChange: "transform",
          }}
        >
          <div className="h-100">
            <Routes>
              <Route path="login" element={<LoginForm />} />
              <Route path="admin-login" element={<LoginForm />} />
              <Route path="register" element={<RegisterForm />} />
              <Route path="forget-password" element={<ForgetPasswordForm />} />
            </Routes>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
