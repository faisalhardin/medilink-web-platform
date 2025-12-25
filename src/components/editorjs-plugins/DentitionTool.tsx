import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../../i18n/config';
import { DentitionDiagram } from './DentitionDiagram';
import { ToothSurfaceModal } from './ToothSurfaceModal';
import { OdontogramData, ToothData, OdontogramToolConfig } from './types';
import { normalizeOdontogramData } from './odontogramDataNormalizer';

export default class DentitionTool {
  private data: OdontogramData;
  private config: OdontogramToolConfig;
  private wrapper: HTMLElement | null = null;
  private root: any = null;
  private selectedToothId: string | null = null;
  private isModalOpen: boolean = false;

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

  constructor({ data, config }: { data?: OdontogramData; config?: OdontogramToolConfig }) {
    // Normalize data to use client-side colors and patterns
    const normalizedData = data ? normalizeOdontogramData(data) : { teeth: {} };
    this.data = normalizedData;
    
    // Ensure teeth object exists even if data was provided
    if (!this.data.teeth) {
      this.data.teeth = {};
    }
    this.config = config || {};
  }

  render() {
    try {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'dentition-tool-wrapper';
      
      this.root = createRoot(this.wrapper);
      this.renderComponent();
      
      return this.wrapper;
    } catch (error) {
      console.error('[DentitionTool] Error in render:', error);
      const fallback = document.createElement('div');
      fallback.textContent = 'Error rendering odontogram v1.0';
      return fallback;
    }
  }

  private renderComponent() {
    if (!this.root) return;

    this.root.render(
      <DentitionToolComponent
        data={this.data}
        config={this.config}
        onToothClick={this.handleToothClick.bind(this)}
        onToothSave={this.handleToothSave.bind(this)}
        onModalClose={this.handleModalClose.bind(this)}
        selectedToothId={this.selectedToothId}
        isModalOpen={this.isModalOpen}
      />
    );
  }

  private handleToothClick(toothId: string) {
    if (this.config.readOnly) return;
    
    this.selectedToothId = toothId;
    this.isModalOpen = true;
    this.renderComponent();
  }

  private handleToothSave(toothData: ToothData) {    
    // Ensure teeth object exists
    if (!this.data.teeth) {
      this.data.teeth = {};
    }
    
    // Initialize tooth data if it doesn't exist
    if (!this.data.teeth[toothData.id]) {
      this.data.teeth[toothData.id] = {
        id: toothData.id,
        surfaces: []
      };
    }
    
    // Normalize wholeToothCode to array format (migration from string to array)
    const normalizedToothData: ToothData = {
      ...toothData,
      wholeToothCode: Array.isArray(toothData.wholeToothCode)
        ? toothData.wholeToothCode
        : (toothData.wholeToothCode ? [toothData.wholeToothCode] : undefined)
    };
    
    // Update tooth data
    this.data.teeth[toothData.id] = normalizedToothData;
    this.isModalOpen = false;
    this.selectedToothId = null;
    this.renderComponent();
  }

  private handleModalClose() {
    this.isModalOpen = false;
    this.selectedToothId = null;
    this.renderComponent();
  }

  save() {
    return this.data as OdontogramData;
  }

  validate(savedData: OdontogramData) {
    if (!savedData || typeof savedData !== 'object') {
      return false;
    }
    
    if (!savedData.teeth || typeof savedData.teeth !== 'object') {
      return false;
    }
    
    return true;
  }

  static get isReadOnlySupported() {
    return true;
  }
}

interface DentitionToolComponentProps {
  data: OdontogramData;
  config: OdontogramToolConfig;
  onToothClick: (toothId: string) => void;
  onToothSave: (toothData: ToothData) => void;
  onModalClose: () => void;
  selectedToothId: string | null;
  isModalOpen: boolean;
}

const DentitionToolComponent: React.FC<DentitionToolComponentProps> = ({
  data,
  config,
  onToothClick,
  onToothSave,
  onModalClose,
  selectedToothId,
  isModalOpen
}) => {
  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px' 
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: '#e0e7ff',
          border: '1px solid #818cf8',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#3730a3'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Version 1.0
        </div>
      </div>

      {config.readOnly && (
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
            <strong>{i18n.t('editor.odontogram.legacyReadOnlyTitle', 'Legacy Odontogram (Read-Only)')}</strong>
            <div style={{ fontSize: '13px', marginTop: '2px', opacity: 0.9 }}>
              {i18n.t('editor.odontogram.legacyReadOnlyMessage', 'This is a legacy odontogram and cannot be edited. Create a new odontogram block to enable editing with the latest features.')}
            </div>
          </div>
        </div>
      )}
      
      <DentitionDiagram
        teethData={data.teeth || {}}
        onToothClick={onToothClick}
        isEditable={!config.readOnly}
        version={config.version || '1.0'}
      />
      
      {isModalOpen && selectedToothId && (
        <ToothSurfaceModal
          toothId={selectedToothId}
          toothData={data.teeth?.[selectedToothId]}
          isOpen={isModalOpen}
          onClose={onModalClose}
          onSave={onToothSave}
        />
      )}
    </>
  );
};
