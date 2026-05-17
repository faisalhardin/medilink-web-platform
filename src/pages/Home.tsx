import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        {t('pages.home')}
      </h1>
    </div>
  );
};

export default Home;
