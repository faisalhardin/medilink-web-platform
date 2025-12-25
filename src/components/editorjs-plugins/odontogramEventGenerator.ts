import { OdontogramEvent } from "@requests/odontogram";

/**
 * Context information required for generating odontogram events
 */
export interface EventContext {
  patientUuid: string;
  visitId: number;
  journeyPointId: string;
}

/**
 * Generates a unique event ID using crypto.randomUUID or fallback
 */
function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a tooth_code_insert event
 * @param toothId - Tooth identifier (FDI notation)
 * @param codes - Array of tooth codes to insert
 * @param context - Event context (patientUuid, visitId, journeyPointId)
 * @returns Complete OdontogramEvent object
 */
export function generateToothCodeInsertEvent(
  toothId: string,
  codes: string[],
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_code_insert",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      whole_tooth_code: codes,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_code_remove event
 * @param toothId - Tooth identifier (FDI notation)
 * @param codes - Array of tooth codes to remove
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothCodeRemoveEvent(
  toothId: string,
  codes: string[],
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_code_remove",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      whole_tooth_code: codes,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_surface_code_set event
 * @param toothId - Tooth identifier
 * @param surface - Surface code (M, D, L, O, V)
 * @param code - Surface treatment code
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothSurfaceCodeSetEvent(
  toothId: string,
  surface: string,
  code: string,
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_surface_code_set",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      surface,
      surface_code: code,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_surface_code_remove event
 * @param toothId - Tooth identifier
 * @param surface - Surface code to remove
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothSurfaceCodeRemoveEvent(
  toothId: string,
  surface: string,
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_surface_code_remove",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      surface,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_general_note_update event
 * @param toothId - Tooth identifier
 * @param notes - General notes text (empty string clears note)
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothGeneralNoteUpdateEvent(
  toothId: string,
  notes: string,
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_general_note_update",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      general_notes: notes,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_surface_note_update event
 * @param toothId - Tooth identifier
 * @param surface - Surface code
 * @param notes - Surface notes text (empty string clears note)
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothSurfaceNoteUpdateEvent(
  toothId: string,
  surface: string,
  notes: string,
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_surface_note_update",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {
      surface,
      surface_notes: notes,
    },
    unix_timestamp: Date.now(),
  };
}

/**
 * Generates a tooth_reset event
 * @param toothId - Tooth identifier
 * @param context - Event context
 * @returns Complete OdontogramEvent object
 */
export function generateToothResetEvent(
  toothId: string,
  context: EventContext
): OdontogramEvent {
  return {
    event_id: generateEventId(),
    visit_id: context.visitId,
    journey_point_id: context.journeyPointId,
    event_type: "tooth_reset",
    tooth_id: toothId,
    patient_uuid: context.patientUuid,
    event_data: {},
    unix_timestamp: Date.now(),
  };
}


