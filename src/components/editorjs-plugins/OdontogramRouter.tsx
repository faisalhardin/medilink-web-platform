import DentitionTool from './DentitionTool';
import OdontogramToolV2 from './OdontogramToolV2';
import { parseVersion } from './versionUtils';
import i18n from '../../i18n/config';

/**
 * Router plugin that delegates to either DentitionTool (v1.0) or OdontogramToolV2 (v2.0)
 * based on the version field in the block data
 */
export default class OdontogramRouter {
  private delegate: DentitionTool | OdontogramToolV2;

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

  constructor({ data, config }: { data?: any; config?: any }) {

    // Determine version from data
    const version = data?.version;
    const parsedVersion = parseVersion(version);
    
    // Check if this is a new block (no data yet) vs old block with data
    const isNewBlock = !data || !data.teeth || Object.keys(data.teeth || {}).length === 0;
    const hasLegacyData = data?.teeth && Object.keys(data.teeth).length > 0 && !data.version;

    // Route to appropriate plugin
    if (parsedVersion >= 2.0 || isNewBlock) {
      // Use v2.0 plugin for:
      // - Blocks with version >= 2.0
      // - New blocks (no data yet)
      this.delegate = new OdontogramToolV2({ data, config });
    } else if (hasLegacyData) {
      // Use v1.0 plugin in read-only mode for:
      // - Blocks with teeth data but no version field (legacy)
      this.delegate = new DentitionTool({ 
        data, 
        config: { ...config, readOnly: true } 
      });
    } else {
      // Default to v2.0 for any edge cases
      this.delegate = new OdontogramToolV2({ data, config });
    }
  }

  render() {
    try {
      const result = this.delegate.render();
      if (!result || !(result instanceof HTMLElement)) {
        const fallback = document.createElement('div');
        fallback.textContent = 'Error rendering odontogram';
        return fallback;
      }
      return result;
    } catch (error) {
      console.error('[OdontogramRouter] Error in render:', error);
      const fallback = document.createElement('div');
      fallback.textContent = 'Error rendering odontogram';
      return fallback;
    }
  }

  save() {
    return this.delegate.save();
  }

  validate(savedData: any) {
    return this.delegate.validate(savedData);
  }

  static get isReadOnlySupported() {
    return true;
  }
}

