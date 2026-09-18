import { api } from "./api";
import type { StudentUpdatePayload } from "./students";
import type {
  Admin,
  AdminCreatePayload,
  AdminUpdatePayload,
  Institution,
  Student,
  StudentStats,
  StudentUploadResponse,
  SuperAdminInstitutionUpdatePayload,
  SuperAdminRegisterPayload,
} from "../types";

// -- Superadmin account -----------------------------------------------------

export async function registerSuperAdmin(payload: SuperAdminRegisterPayload) {
  const { data } = await api.post<{ message: string }>(
    "/superadmin/register",
    payload
  );
  return data;
}

export async function verifySuperAdminOtp(email: string, otp: string) {
  const { data } = await api.post<{ message: string }>(
    "/superadmin/verify-otp",
    { email, otp }
  );
  return data;
}

export async function loginSuperAdmin(email: string, password: string) {
  const { data } = await api.post<{ access_token: string; token_type: string }>(
    "/superadmin/login",
    { email, password }
  );
  return data;
}

export async function requestSuperAdminPasswordReset(email: string) {
  const { data } = await api.post<{ message: string }>(
    "/superadmin/password-reset/request",
    { email }
  );
  return data;
}

export async function confirmSuperAdminPasswordReset(
  email: string,
  otp: string,
  new_password: string
) {
  const { data } = await api.post<{ message: string }>(
    "/superadmin/password-reset/confirm",
    { email, otp, new_password }
  );
  return data;
}

// -- Institution management --------------------------------------------------

export async function getAllInstitutionsAsSuperAdmin() {
  const { data } = await api.get<Institution[]>(
    "/superadmin/superadmin-get-all-institutes"
  );
  return data;
}

export async function updateInstitutionAsSuperAdmin(
  institutionId: string,
  payload: SuperAdminInstitutionUpdatePayload
) {
  const { data } = await api.patch<Institution>(
    `/superadmin/superadmin-update-institution/${institutionId}`,
    payload
  );
  return data;
}

export async function deleteInstitutionAsSuperAdmin(institutionId: string) {
  await api.delete(`/superadmin/delete-institution/${institutionId}`);
}

// -- Admin management ---------------------------------------------------------

export async function createAdmin(payload: AdminCreatePayload) {
  const { data } = await api.post<{ message: string }>(
    "/superadmin/admin-creation",
    payload
  );
  return data;
}

export async function getAdmins() {
  const { data } = await api.get<Admin[]>("/superadmin/admins");
  return data;
}

export async function updateAdmin(adminId: string, payload: AdminUpdatePayload) {
  const { data } = await api.patch<Admin>(
    `/superadmin/admin/${adminId}`,
    payload
  );
  return data;
}

export async function deleteAdmin(adminId: string) {
  await api.delete(`/superadmin/admin/${adminId}`);
}

// -- Student management (superadmin scope) ------------------------------------

export async function uploadStudentsAsSuperAdmin(
  excelFile: File,
  certificates: File[],
  batchYear: string,
  institutionId: string
) {
  const form = new FormData();
  form.append("excel_file", excelFile);
  form.append("batch_year", batchYear);
  form.append("institution_id", institutionId);
  certificates.forEach((file) => form.append("certificates", file));

  const { data } = await api.post<StudentUploadResponse>(
    "/superadmin/students/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function listStudentsByInstitutionAsSuperAdmin(institutionName: string) {
  const { data } = await api.get<Student[]>(
    `/superadmin/students/institution/${encodeURIComponent(institutionName)}`
  );
  return data;
}

export async function listStudentsByInstitutionAndYearAsSuperAdmin(
  institutionName: string,
  year: number
) {
  const { data } = await api.get<Student[]>(
    `/superadmin/students/institution/${encodeURIComponent(institutionName)}/year/${year}`
  );
  return data;
}

export async function listStudentsByInstitutionAndBatchAsSuperAdmin(
  institutionName: string,
  batchYear: string
) {
  const { data } = await api.get<Student[]>(
    `/superadmin/students/institution/${encodeURIComponent(institutionName)}/batch/${encodeURIComponent(batchYear)}`
  );
  return data;
}

export async function getStudentStatsAsSuperAdmin(institutionId: string) {
  const { data } = await api.get<StudentStats>(
    `/superadmin/students/stats/${encodeURIComponent(institutionId)}`
  );
  return data;
}

export async function getStudentAsSuperAdmin(rollNoCertificateNo: string) {
  const { data } = await api.get<Student>(
    `/superadmin/students/${encodeURIComponent(rollNoCertificateNo)}`
  );
  return data;
}

export async function updateStudentAsSuperAdmin(
  rollNoCertificateNo: string,
  payload: StudentUpdatePayload
) {
  const { data } = await api.patch<Student>(
    `/superadmin/students/${encodeURIComponent(rollNoCertificateNo)}`,
    payload
  );
  return data;
}

export async function deleteStudentAsSuperAdmin(rollNoCertificateNo: string) {
  await api.delete(`/superadmin/students/${encodeURIComponent(rollNoCertificateNo)}`);
}
