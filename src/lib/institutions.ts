import { api } from "./api";
import type { Institution, RegisterPayload } from "../types";

export async function registerInstitution(payload: RegisterPayload) {
  const { data } = await api.post<Institution>("/institutions/register", payload);
  return data;
}

export async function loginInstitution(email_id: string, password: string) {
  const { data } = await api.post<{ access_token: string; token_type: string }>(
    "/institutions/login",
    { email_id, password }
  );
  return data;
}

export async function verifyOtp(email_id: string, otp: string) {
  const { data } = await api.post<Institution>("/institutions/verify-otp", {
    email_id,
    otp,
  });
  return data;
}

export async function requestPasswordReset(email_id: string) {
  const { data } = await api.post<{ message: string }>(
    "/institutions/password-reset/request",
    { email_id }
  );
  return data;
}

export async function confirmPasswordReset(
  email_id: string,
  otp: string,
  new_password: string
) {
  const { data } = await api.post<{ message: string }>(
    "/institutions/password-reset/confirm",
    { email_id, otp, new_password }
  );
  return data;
}

export async function getAllInstitutions() {
  const { data } = await api.get<Institution[]>("/institutions/get-all-institutes");
  return data;
}

export async function getInstitution(institutionId: string) {
  const { data } = await api.get<Institution>(
    `/institutions/institution/${institutionId}`
  );
  return data;
}

export async function updateInstitution(
  institutionId: string,
  payload: Partial<RegisterPayload>
) {
  const { data } = await api.patch<Institution>(
    `/institutions/update-institution/${institutionId}`,
    payload
  );
  return data;
}

export async function deleteInstitution(institutionId: string) {
  await api.delete(`/institutions/delete-institution/${institutionId}`);
}
