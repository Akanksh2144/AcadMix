import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

interface CollegeModule {
  module_name: string;
  student_visible: boolean;
}

export const useCollegeModules = () => {
  // We check if authToken exists internally or rely on user authentication state
  // Assuming a global auth token from localStorage or api instance.
  // Actually, we pass a simple true/false down or let the query catch the 401 if missing
  const token = localStorage.getItem("auth_token");
  
  return useQuery<CollegeModule[]>({
    queryKey: ["college-modules"],
    queryFn: () => api.get("/college/modules").then(r => r.data),
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 10 * 60 * 1000,
    enabled: !!token,  // only fires when logged in
  });
};

export const useIsModuleVisible = (moduleName: string) => {
  const { data } = useCollegeModules();
  return data?.find((m: CollegeModule) => m.module_name === moduleName)?.student_visible ?? false;
};

export const useIsPreEnrollOpen = () => {
  // This one hits the PUBLIC endpoint, no auth token needed
  // Used exclusively by the Login page
  return useQuery({
    queryKey: ["pre-enroll-status"],
    queryFn: () => api.get("/pre-enroll/status").then(r => r.data),
    staleTime: 60 * 1000,
  });
};
