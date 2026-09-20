export type InstitutionApprovalStatus = "Approved" | "Pending" | "Suspended";

export interface Institution {
  institution_id: string;
  name: string;
  email_id: string;
  institution_name: string;
  institutional_code?: string;
  gst_number?: string;
  postal_code: string | null;
  city: string;
  state: string | null;
  country: string;
  mobile_no: string | null;
  otp_verified: boolean;
  superadmin_status: InstitutionApprovalStatus;
  status: boolean;
}

export interface Student {
  student_id: string;
  institution_id: string;
  institution_name: string;
  certificate_id?: string;
  certificate_no: string;
  roll_no: string;
  student_name: string;
  surname_lastName: string;
  course_or_Acadamic: string;
  month_year_pass: string;
  grade: string;
  batch_year: string;
  certificate_url: string | null;
}

export interface UploadRowError {
  row: number;
  reason: string;
}

export interface StudentUploadResponse {
  inserted_count: number;
  students: Student[];
  errors: UploadRowError[];
  unmatched_certificates: string[];
}

export interface StudentStats {
  institution_id: string;
  total_students: number;
  /** Counts keyed by the 4-digit pass-out year found in month_year_pass. */
  by_year: Record<string, number>;
  by_department: Record<string, number>;
  by_grade: Record<string, number>;
  by_batch_year: Record<string, number>;
}

export interface RegisterPayload {
  name: string;
  email_id: string;
  institution_name: string;
  institutional_code: string;
  gst_number: string;
  postal_code?: string | null;
  city: string;
  state?: string | null;
  country: string;
  mobile_no?: string | null;
  password: string;
}

export interface JwtPayload {
  sub: string;
  role: "institution";
  institution_id: string;
  email: string;
  token_type: "access";
  exp: number;
}

export interface ApiErrorShape {
  detail?: string | { msg: string }[];
}

export type AdminAccessLevel = "full" | "custom";

export type AdminPermissionKey =
  | "students_view"
  | "students_create"
  | "students_update"
  | "students_delete"
  | "institutions_view"
  | "institutions_create"
  | "institutions_update"
  | "institutions_delete";

export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export interface Admin {
  admin_id: string;
  admin_loginId: string;
  admin_name: string;
  email: string;
  mobilenumber: string;
  password: string;
  superadmin_id: string;
  role: string;
  access_level?: AdminAccessLevel;
  permissions?: Partial<AdminPermissions>;
  status?: boolean;
}

export interface AdminMe {
  admin_id: string;
  admin_loginId: string;
  admin_name: string;
  email: string;
  access_level: AdminAccessLevel;
  permissions: Partial<AdminPermissions>;
  status: boolean;
}

export interface AdminCreatePayload {
  admin_name: string;
  email: string;
  mobilenumber: string;
  admin_userId: string;
  password: string;
  access_level: AdminAccessLevel;
  permissions: AdminPermissions;
  status: boolean;
}

export type AdminUpdatePayload = Partial<AdminCreatePayload>;

export interface SuperAdminProfile {
  unique_id: string;
  fullname: string;
  email: string;
  mobilenumber: string;
  password?: string;
  role: string;
}

export interface SuperAdminRegisterPayload {
  fullname: string;
  email: string;
  mobilenumber: string;
  password: string;
}

export type SuperAdminInstitutionUpdatePayload = Partial<
  Pick<
    RegisterPayload,
    | "name"
    | "email_id"
    | "institution_name"
    | "institutional_code"
    | "gst_number"
    | "postal_code"
    | "city"
    | "state"
    | "country"
    | "mobile_no"
    | "password"
  > & {
    superadmin_status: InstitutionApprovalStatus;
    status: boolean;
  }
>;

export type AdminInstitutionUpdatePayload = SuperAdminInstitutionUpdatePayload;
