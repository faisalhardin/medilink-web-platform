import InstitutionProfileComponent from '@components/Institution';
import ProductOrderStatistics from '@components/ProductOrderStatistics';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';

const Institution = () => {
    const canViewStatistics = hasPermission(getStorageUser(), PERMISSIONS.product.statistics);

    return (
        <div className="w-full">
            {canViewStatistics && (
                <div className="px-6 pt-6">
                    <ProductOrderStatistics />
                </div>
            )}
            <InstitutionProfileComponent />
        </div>
    );
};

export default Institution;
