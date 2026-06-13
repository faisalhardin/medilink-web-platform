import authedClient from '@utils/apiClient';
import { STAFF_PATH } from 'constants/constants';
import {
  ListStaffResponse,
  StaffMember,
  CreateStaffRequest,
  AssignRoleRequest,
  UnassignRoleRequest,
} from '@models/staff';

export const ListStaff = async (includeInactive = false): Promise<ListStaffResponse> => {
  try {
    const response = await authedClient.get(`${STAFF_PATH}`, {
      withCredentials: true,
      params: { include_inactive: includeInactive },
    });
    return response.data.data as ListStaffResponse;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

export const GetStaff = async (uuid: string): Promise<StaffMember> => {
  try {
    const response = await authedClient.get(`${STAFF_PATH}/${uuid}`, {
      withCredentials: true,
    });
    return response.data.data as StaffMember;
  } catch (error) {
    console.error('Error fetching staff member:', error);
    throw error;
  }
};

export const CreateStaff = async (body: CreateStaffRequest): Promise<string> => {
  try {
    const response = await authedClient.post(`${STAFF_PATH}`, body, {
      withCredentials: true,
    });
    return response.data.data as string;
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
};

export const AssignRole = async (body: AssignRoleRequest): Promise<string> => {
  try {
    const response = await authedClient.post(`${STAFF_PATH}/role/assign`, body, {
      withCredentials: true,
    });
    return response.data.data as string;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

export const UnassignRole = async (body: UnassignRoleRequest): Promise<string> => {
  try {
    const response = await authedClient.delete(`${STAFF_PATH}/role/unassign`, {
      data: body,
      withCredentials: true,
    });
    return response.data.data as string;
  } catch (error) {
    console.error('Error unassigning role:', error);
    throw error;
  }
};

export const DeactivateStaff = async (uuid: string): Promise<string> => {
  try {
    const response = await authedClient.patch(`${STAFF_PATH}/${uuid}/deactivate`, null, {
      withCredentials: true,
    });
    return response.data.data as string;
  } catch (error) {
    console.error('Error deactivating staff:', error);
    throw error;
  }
};

export const ActivateStaff = async (uuid: string): Promise<string> => {
  try {
    const response = await authedClient.patch(`${STAFF_PATH}/${uuid}/activate`, null, {
      withCredentials: true,
    });
    return response.data.data as string;
  } catch (error) {
    console.error('Error activating staff:', error);
    throw error;
  }
};
