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

export async function getStudent(rollNoCertificateNo: string) {
  const { data } = await api.get<Student | Student[]>(
    `/students/${encodeURIComponent(rollNoCertificateNo)}`
  );
  return data;
}

export type StudentUpdatePayload = Partial<
  Pick<
    Student,
    | "roll_no_certificate_no"
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
