import { api } from "./api";

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  gender?: string;
  state?: string;
  minSalary?: number;
  maxSalary?: number;
}

export const employeeService = {
  getEmployees: async (params?: EmployeeQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get(`/employees${queryString ? `?${queryString}` : ""}`);
  },

  getEmployeeById: async (id: string) => {
    return api.get(`/employees/${id}`);
  },

  createEmployee: async (employeeData: any) => {
    return api.post("/employees", employeeData);
  },

  updateEmployee: async (id: string, employeeData: any) => {
    return api.put(`/employees/${id}`, employeeData);
  },

  deleteEmployee: async (id: string) => {
    return api.delete(`/employees/${id}`);
  },

  // Attendance
  getAttendance: async (params?: any) => {
    return api.get("/attendance", params ? ({ params } as any) : undefined);
  },

  getAttendanceStats: async () => {
    return api.get("/attendance/stats");
  },

  getAttendanceByDate: async (date: string) => {
    return api.get(`/attendance/date/${date}`);
  },

  markAttendance: async (attendanceData: any) => {
    return api.post("/attendance/mark", attendanceData);
  },

  // Salary
  getSalaryPayments: async () => {
    return api.get("/salary");
  },

  createSalaryPayment: async (salaryData: any) => {
    return api.post("/salary", salaryData);
  },

  getSalarySummary: async (params?: any) => {
    return api.get("/salary/summary", params ? ({ params } as any) : undefined);
  },
};
