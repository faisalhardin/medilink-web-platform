import { useTranslation } from 'react-i18next';
import { Alert } from '@mui/material';

const WageConfig = () => {
  const { t } = useTranslation();
  return <Alert severity="info">{t('compensation.wageComingSoon')}</Alert>;
};

export default WageConfig;
