export interface StaffRole {
  role_id: number;
  name: string;
}

export interface StaffMember {
  uuid: string;
  name: string;
  email: string;
  institution_id: number;
  institution_name: string;
  roles: StaffRole[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListStaffResponse {
  staff: StaffMember[];
  total: number;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  role_ids: number[];
}

export interface AssignRoleRequest {
  staff_uuid: string;
  role_id: number;
}

export interface UnassignRoleRequest {
  staff_uuid: string;
  role_id: number;
}
