import { api } from "./api";
import type { Student, StudentStats, StudentUploadResponse } from "../types";

export async function uploadStudents(
  excelFile: File,
  certificates: File[],
  batchYear: string
) {
  const form = new FormData();
  form.append("excel_file", excelFile);
  form.append("batch_year", batchYear);
  certificates.forEach((file) => form.append("certificates", file));

  const { data } = await api.post<StudentUploadResponse>(
    "/students/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export interface SingleStudentPayload {
  institution_id?: string;
  batch_year: string;
  certificate_no: string;
  roll_no: string;
  student_name: string;
  surname_lastName: string;
  course_or_Acadamic: string;
  month_year_pass: string;
  grade: string;
}

export function singleStudentFormData(payload: SingleStudentPayload, certificate: File) {
  const form = new FormData();
  (Object.keys(payload) as (keyof SingleStudentPayload)[]).forEach((key) => {
    const value = payload[key];
    if (value !== undefined) form.append(key, value);
  });
  form.append("certificate", certificate);
  return form;
}

export async function addStudent(payload: SingleStudentPayload, certificate: File) {
  const { data } = await api.post<Student>("/students", singleStudentFormData(payload, certificate), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listStudentsByInstitution(institutionName: string) {
  const { data } = await api.get<Student[]>(
    `/students/institution/${encodeURIComponent(institutionName)}`
  );
  return data;
}

export async function listStudentsByInstitutionAndYear(
  institutionName: string,
  year: number
) {
  const { data } = await api.get<Student[]>(
    `/students/institution/${encodeURIComponent(institutionName)}/year/${year}`
  );
  return data;
}

export async function listStudentsByInstitutionAndBatch(
  institutionName: string,
  batchYear: string
) {
  const { data } = await api.get<Student[]>(
    `/students/institution/${encodeURIComponent(institutionName)}/batch/${encodeURIComponent(batchYear)}`
  );
  return data;
}

export async function getStudentStats(institutionId: string) {
  const { data } = await api.get<StudentStats>(
    `/students/stats/${encodeURIComponent(institutionId)}`
  );
  return data;
}

export interface StudentSuggestion {
  student_id: string;
  roll_no: string;
  certificate_no: string;
  certificate_id?: string;
  student_name: string;
  surname_lastName: string;
  institution_name: string;
  course_or_Acadamic: string;
  batch_year: string;
}

export async function suggestStudents(query: string, signal?: AbortSignal) {
  const { data } = await api.get<StudentSuggestion[]>("/students/search", {
    params: { q: query, limit: 8 },
    signal,
  });
  return data;
}

export async function getStudent(rollNoCertificateNo: string) {
  const { data } = await api.get<Student | Student[]>(
    `/students/${encodeURIComponent(rollNoCertificateNo)}`
  );
  return data;
}

export type StudentUpdatePayload = Partial<
  Pick<
    Student,
    | "certificate_no"
    | "roll_no"
    | "student_name"
    | "surname_lastName"
    | "course_or_Acadamic"
    | "month_year_pass"
    | "grade"
    | "batch_year"
    | "certificate_url"
  >
>;

export async function updateStudent(
  rollNoCertificateNo: string,
  payload: StudentUpdatePayload
) {
  const { data } = await api.patch<Student>(
    `/students/${encodeURIComponent(rollNoCertificateNo)}`,
    payload
  );
  return data;
}

export async function deleteStudent(rollNoCertificateNo: string) {
  await api.delete(`/students/${encodeURIComponent(rollNoCertificateNo)}`);
}
