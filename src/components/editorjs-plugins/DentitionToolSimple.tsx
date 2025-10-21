import { OdontogramData } from './types';

interface DentitionToolConfig {
  readOnly?: boolean;
}

export default class DentitionToolSimple {
  private data: OdontogramData;
  private config: DentitionToolConfig;
  private wrapper: HTMLElement | null = null;

  static get toolbox() {
    return {
      title: 'Dentition Chart',
      icon: '🦷'
    };
  }

  constructor({ data, config }: { data?: OdontogramData; config?: DentitionToolConfig }) {
    console.log('DentitionToolSimple constructor called with:', { data, config });
    this.data = data || { teeth: {} };
    this.config = config || {};
  }

  render() {
    console.log('DentitionToolSimple render() called');
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dentition-tool-wrapper p-4';
    
    // Create a simple HTML structure for testing
    this.wrapper.innerHTML = `
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">
          Dental Chart - FDI Notation (Test)
        </h3>
        <div class="text-center">
          <p class="text-gray-600 mb-4">This is a test dentition chart.</p>
          <div class="grid grid-cols-8 gap-2 max-w-md mx-auto">
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">18</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">17</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">16</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">15</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">14</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">13</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">12</div>
            <div class="h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center">11</div>
          </div>
          <p class="text-sm text-gray-500 mt-2">Upper Right Quadrant (Test)</p>
        </div>
      </div>
    `;
    
    return this.wrapper;
  }

  save() {
    return this.data;
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
