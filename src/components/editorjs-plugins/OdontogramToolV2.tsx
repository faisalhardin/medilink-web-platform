import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../../i18n/config';
import { DentitionDiagram } from './DentitionDiagram';
import { ToothSurfaceModal } from './ToothSurfaceModal';
import { OdontogramData, OdontogramDataV2, ToothData, OdontogramToolConfigV2 } from './types';
import { GetOdontogramSnapshot, PostOdontogramEvents, OdontogramEvent } from '@requests/odontogram';
import {
  EventContext,
  generateToothCodeInsertEvent,
  generateToothCodeRemoveEvent,
  generateToothSurfaceCodeSetEvent,
  generateToothSurfaceCodeRemoveEvent,
  generateToothGeneralNoteUpdateEvent,
  generateToothSurfaceNoteUpdateEvent,
} from './odontogramEventGenerator';
import { showSuccessToast, showErrorToast, showInfoToast } from '@utils/toast';
import { normalizeOdontogramData } from './odontogramDataNormalizer';

export default class OdontogramToolV2 {
  private data: OdontogramDataV2;
  private config: OdontogramToolConfigV2;
  private wrapper: HTMLElement | null = null;
  private root: any = null;
  private selectedToothId: string | null = null;
  private isModalOpen: boolean = false;
  private initialSnapshot: OdontogramData | null = null;
  private currentState: OdontogramData = { teeth: {} };
  private pendingEvents: OdontogramEvent[] = [];
  private isLoading: boolean = false;

  static get toolbox() {
    return {
      title: i18n.t('editor.odontogram.title'),
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`
    };
  }

  constructor({ data, config }: { data?: OdontogramDataV2; config?: OdontogramToolConfigV2 }) {
    this.data = data || { version: "2.0", teeth: {} };
    this.config = config || {};
    
    // Ensure version is set
    if (!this.data.version) {
      this.data.version = "2.0";
    }

    // Initialize empty state - will be populated from backend snapshot
    this.currentState = { teeth: {} };

    // Load pending events from localStorage
    this.loadPendingEvents();
  }

  render() {
    try {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'odontogram-tool-v2-wrapper';
      
      this.root = createRoot(this.wrapper);

      // Fetch snapshot asynchronously if visit context is available
      if (this.canSave() && !this.initialSnapshot) {
        this.fetchSnapshot();
      }

      this.renderComponent();
      
      return this.wrapper;
    } catch (error) {
      console.error('[OdontogramToolV2] Error in render:', error);
      const fallback = document.createElement('div');
      fallback.textContent = 'Error rendering odontogram v2.0';
      return fallback;
    }
  }

  private renderComponent() {
    if (!this.root) return;

    this.root.render(
      <OdontogramToolV2Component
        data={this.data}
        config={this.config}
        currentState={this.currentState}
        isLoading={this.isLoading}
        onToothClick={this.handleToothClick.bind(this)}
        onToothSave={this.handleToothSave.bind(this)}
        onModalClose={this.handleModalClose.bind(this)}
        selectedToothId={this.selectedToothId}
        isModalOpen={this.isModalOpen}
        canSave={this.canSave()}
      />
    );
  }

  private canSave(): boolean {
    return !!(
      this.config.patientUuid &&
      this.config.visitId &&
      this.config.journeyPointId
    );
  }

  private async fetchSnapshot() {
    if (!this.config.patientUuid) {
      showInfoToast('Waiting for visit context...');
      return;
    }

    try {
      this.isLoading = true;
      this.renderComponent();

      const response = await GetOdontogramSnapshot({
        patientUuid: this.config.patientUuid!,
        visitId: this.config.visitId,
      });
      
      // Normalize snapshot data to use client-side colors and patterns
      const normalizedSnapshot = normalizeOdontogramData(response.snapshot);
      
      // Store initial snapshot as baseline for change detection
      this.initialSnapshot = { teeth: { ...normalizedSnapshot.teeth } };
      
      // Use snapshot as current state - event log is the source of truth
      this.currentState = { teeth: { ...normalizedSnapshot.teeth } };

      this.isLoading = false;
      this.renderComponent();
    } catch (error) {
      console.error('Error fetching odontogram snapshot:', error);
      showErrorToast('Failed to load odontogram data');
      this.isLoading = false;
      this.renderComponent();
    }
  }

  private handleToothClick(toothId: string) {
    if (this.config.readOnly || !this.canSave()) return;
    
    this.selectedToothId = toothId;
    this.isModalOpen = true;
    this.renderComponent();
  }

  private async handleToothSave(toothData: ToothData) {
    if (!this.canSave()) {
      showErrorToast('Visit context required to save changes');
      return;
    }

    // Update current state
    this.currentState.teeth[toothData.id] = toothData;

    // Generate events for the changes
    const events = this.generateEventsForToothChange(toothData);
    
    // Add to pending events
    this.pendingEvents.push(...events);

    // Try to send events
    await this.sendPendingEvents();

    this.isModalOpen = false;
    this.selectedToothId = null;
    this.renderComponent();
  }

  private normalizeNote(note: string | undefined | null): string {
    return note || '';
  }

  private generateEventsForToothChange(toothData: ToothData): OdontogramEvent[] {
    const events: OdontogramEvent[] = [];
    const context: EventContext = {
      patientUuid: this.config.patientUuid!,
      visitId: this.config.visitId!,
      journeyPointId: this.config.journeyPointId!,
    };

    const oldToothData = this.initialSnapshot?.teeth[toothData.id];

    // Generate events for whole tooth codes
    if (toothData.wholeToothCode) {
      const newCodes = Array.isArray(toothData.wholeToothCode) 
        ? toothData.wholeToothCode 
        : [toothData.wholeToothCode];
      const oldCodes = oldToothData?.wholeToothCode 
        ? (Array.isArray(oldToothData.wholeToothCode) ? oldToothData.wholeToothCode : [oldToothData.wholeToothCode])
        : [];

      // Codes to insert
      const codesToInsert = newCodes.filter(code => !oldCodes.includes(code));
      if (codesToInsert.length > 0) {
        events.push(generateToothCodeInsertEvent(toothData.id, codesToInsert, context));
      }

      // Codes to remove
      const codesToRemove = oldCodes.filter(code => !newCodes.includes(code));
      if (codesToRemove.length > 0) {
        events.push(generateToothCodeRemoveEvent(toothData.id, codesToRemove, context));
      }
    }

    // Generate events for surfaces (additions and updates)
    toothData.surfaces.forEach(surface => {
      const oldSurface = oldToothData?.surfaces.find(s => s.surface === surface.surface);
      
      // If surface code changed or is new, generate set event
      if (!oldSurface || oldSurface.code !== surface.code) {
        events.push(generateToothSurfaceCodeSetEvent(toothData.id, surface.surface, surface.code, context));
      }

      // If surface notes changed, generate note update event
      const oldSurfaceNote = this.normalizeNote(oldSurface?.notes);
      const newSurfaceNote = this.normalizeNote(surface.notes);
      
      if (newSurfaceNote !== oldSurfaceNote) {
        events.push(generateToothSurfaceNoteUpdateEvent(toothData.id, surface.surface, newSurfaceNote, context));
      }
    });

    // Generate events for removed surfaces
    if (oldToothData?.surfaces) {
      oldToothData.surfaces.forEach(oldSurface => {
        const stillExists = toothData.surfaces.find(s => s.surface === oldSurface.surface);
        
        // If old surface no longer exists in new data, generate remove event
        if (!stillExists) {
          events.push(generateToothSurfaceCodeRemoveEvent(toothData.id, oldSurface.surface, context));
        }
      });
    }

    // Generate event for general notes only if there's a real change
    const oldNote = this.normalizeNote(oldToothData?.generalNotes);
    const newNote = this.normalizeNote(toothData.generalNotes);
    
    if (newNote !== oldNote) {
      events.push(generateToothGeneralNoteUpdateEvent(toothData.id, newNote, context));
    }

    return events;
  }

  private async sendPendingEvents() {
    if (this.pendingEvents.length === 0) return;

    try {
      await PostOdontogramEvents(this.pendingEvents);
      showSuccessToast('Changes saved successfully');
      
      // Clear pending events
      this.pendingEvents = [];
      this.savePendingEvents();

      // Sync with server to get updated snapshot
      await this.syncWithServer();
    } catch (error) {
      console.error('Error sending odontogram events:', error);
      showErrorToast('Failed to save changes. Will retry later.');
      
      // Save pending events to localStorage
      this.savePendingEvents();
    }
  }

  private async syncWithServer() {
    if (!this.config.patientUuid) return;

    try {
      const response = await GetOdontogramSnapshot({
        patientUuid: this.config.patientUuid!,
        visitId: this.config.visitId,
      });
      
      // Update initial snapshot
      this.initialSnapshot = { teeth: { ...response.snapshot.teeth } };
      
      this.renderComponent();
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }

  private handleModalClose() {
    this.isModalOpen = false;
    this.selectedToothId = null;
    this.renderComponent();
  }


  private loadPendingEvents() {
    if (!this.config.patientUuid) return;

    const key = `odontogram_pending_events_${this.config.patientUuid}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        this.pendingEvents = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading pending events:', error);
      }
    }
  }

  private savePendingEvents() {
    if (!this.config.patientUuid) return;

    const key = `odontogram_pending_events_${this.config.patientUuid}`;
    
    if (this.pendingEvents.length > 0) {
      localStorage.setItem(key, JSON.stringify(this.pendingEvents));
    } else {
      localStorage.removeItem(key);
    }
  }

  save() {
    // Don't store tooth data - event log is source of truth
    // Only save metadata to mark this as a v2.0 odontogram block
    return {
      version: "2.0",
      teeth: {}, // Empty - data comes from event log
      patientUuid: this.config.patientUuid,
      visitId: this.config.visitId,
      journeyPointId: this.config.journeyPointId,
    } as OdontogramDataV2;
  }

  validate(savedData: OdontogramDataV2) {
    if (!savedData || typeof savedData !== 'object') {
      return false;
    }
    
    if (savedData.version !== "2.0") {
      return false;
    }
    
    return true;
  }

  static get isReadOnlySupported() {
    return true;
  }
}

interface OdontogramToolV2ComponentProps {
  data: OdontogramDataV2;
  config: OdontogramToolConfigV2;
  currentState: OdontogramData;
  isLoading: boolean;
  onToothClick: (toothId: string) => void;
  onToothSave: (toothData: ToothData) => void;
  onModalClose: () => void;
  selectedToothId: string | null;
  isModalOpen: boolean;
  canSave: boolean;
}

const OdontogramToolV2Component: React.FC<OdontogramToolV2ComponentProps> = ({
  config,
  currentState,
  isLoading,
  onToothClick,
  onToothSave,
  onModalClose,
  selectedToothId,
  isModalOpen,
  canSave,
}) => {
  // Always display current state from event log
  const displayData = currentState;

  return (
    <div className="odontogram-v2-container">      
      {!canSave && !config.readOnly && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>{i18n.t('editor.odontogram.noContextTitle', 'Visit Context Required')}</strong>
            <div style={{ fontSize: '13px', marginTop: '2px', opacity: 0.9 }}>
              {i18n.t('editor.odontogram.noContextMessage', 'Changes cannot be saved without patient and visit information.')}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-600">Loading odontogram...</div>
        </div>
      ) : (
        <>
          <DentitionDiagram
            teethData={displayData.teeth}
            onToothClick={onToothClick}
            isEditable={!config.readOnly && canSave}
            version={config.version || '2.0'}
          />
          
          {isModalOpen && selectedToothId && (
            <ToothSurfaceModal
              toothId={selectedToothId}
              toothData={displayData.teeth[selectedToothId]}
              isOpen={isModalOpen}
              onClose={onModalClose}
              onSave={onToothSave}
            />
          )}
        </>
      )}
    </div>
  );
};

