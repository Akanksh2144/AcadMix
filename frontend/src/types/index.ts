export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "hod" | "principal" | "admin" | "nodal_officer" | "alumni" | "industry" | "exam_cell";
  college_id: string;
  is_anonymized: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: "success" | "error";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
}
