import InstitutionProfileComponent from '@components/Institution';
import ProductOrderStatistics from '@components/ProductOrderStatistics';

const Institution = () => {
    return (
        <div className="w-full">
            <div className="px-6 pt-6">
                <ProductOrderStatistics />
            </div>
            <InstitutionProfileComponent />
        </div>
    );
};

export default Institution;
