import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const AxiosInterceptor = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("ss_token");
          localStorage.removeItem("ss_user");
          navigate("/login");
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [navigate]); // ✅ only navigate, no loading

  return children;
};

export default AxiosInterceptor;
