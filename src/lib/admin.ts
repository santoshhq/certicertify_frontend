import { api } from "./api";
import type { StudentUpdatePayload } from "./students";
import type {
  AdminInstitutionUpdatePayload,
  Institution,
  Student,
  StudentStats,
  StudentUploadResponse,
} from "../types";

// -- Admin account -------------------------------------------------------

export async function loginAdmin(admin_loginId: string, password: string) {
  const { data } = await api.post<{
    access_token: string;
    token_type: string;
    admin_name?: string;
  }>("/admin/login", { admin_loginId, password });
  return data;
}

// -- Institution management ------------------------------------------------

export async function getAllInstitutionsAsAdmin() {
  const { data } = await api.get<Institution[]>("/admin/admin-get-all-institutes");
  return data;
}

export async function updateInstitutionAsAdmin(
  institutionId: string,
  payload: AdminInstitutionUpdatePayload
) {
  const { data } = await api.patch<Institution>(
    `/admin/admin-update-institution/${institutionId}`,
    payload
  );
  return data;
}

export async function deleteInstitutionAsAdmin(institutionId: string) {
  await api.delete(`/admin/delete-institution/${institutionId}`);
}

// -- Student management (admin scope) ---------------------------------------

export async function uploadStudentsAsAdmin(
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
    "/admin/students/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function listStudentsByInstitutionAsAdmin(institutionName: string) {
  const { data } = await api.get<Student[]>(
    `/admin/students/institution/${encodeURIComponent(institutionName)}`
  );
  return data;
}

export async function listStudentsByInstitutionAndYearAsAdmin(
  institutionName: string,
  year: number
) {
  const { data } = await api.get<Student[]>(
    `/admin/students/institution/${encodeURIComponent(institutionName)}/year/${year}`
  );
  return data;
}

export async function listStudentsByInstitutionAndBatchAsAdmin(
  institutionName: string,
  batchYear: string
) {
  const { data } = await api.get<Student[]>(
    `/admin/students/institution/${encodeURIComponent(institutionName)}/batch/${encodeURIComponent(batchYear)}`
  );
  return data;
}

export async function getStudentStatsAsAdmin(institutionId: string) {
  const { data } = await api.get<StudentStats>(
    `/admin/students/stats/${encodeURIComponent(institutionId)}`
  );
  return data;
}

export async function getStudentAsAdmin(rollNoCertificateNo: string) {
  const { data } = await api.get<Student>(
    `/admin/students/${encodeURIComponent(rollNoCertificateNo)}`
  );
  return data;
}

export async function updateStudentAsAdmin(
  rollNoCertificateNo: string,
  payload: StudentUpdatePayload
) {
  const { data } = await api.patch<Student>(
    `/admin/students/${encodeURIComponent(rollNoCertificateNo)}`,
    payload
  );
  return data;
}

export async function deleteStudentAsAdmin(rollNoCertificateNo: string) {
  await api.delete(`/admin/students/${encodeURIComponent(rollNoCertificateNo)}`);
}
