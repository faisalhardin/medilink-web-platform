import React from 'react';
import { createRoot } from 'react-dom/client';
import { DentitionDiagram } from './DentitionDiagram';
import { ToothModal } from './ToothModal';
import { DentitionData, ToothData } from './types';

interface DentitionToolConfig {
  readOnly?: boolean;
}

export default class DentitionTool {
  private data: DentitionData;
  private config: DentitionToolConfig;
  private wrapper: HTMLElement | null = null;
  private root: any = null;
  private selectedToothId: string | null = null;
  private isModalOpen: boolean = false;

  static get toolbox() {
    return {
      title: 'Dentition Chart',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`
    };
  }

  constructor({ data, config }: { data?: DentitionData; config?: DentitionToolConfig }) {
    this.data = data || { teeth: {} };
    // Ensure teeth object exists even if data was provided
    if (!this.data.teeth) {
      this.data.teeth = {};
    }
    this.config = config || {};
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dentition-tool-wrapper';
    
    this.root = createRoot(this.wrapper);
    this.renderComponent();
    
    return this.wrapper;
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
    
    this.data.teeth[toothData.id] = toothData;
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
    return this.data;
  }

  validate(savedData: DentitionData) {
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
  data: DentitionData;
  config: DentitionToolConfig;
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
      <DentitionDiagram
        teethData={data.teeth || {}}
        onToothClick={onToothClick}
        isEditable={!config.readOnly}
      />
      
      {isModalOpen && selectedToothId && (
        <ToothModal
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
