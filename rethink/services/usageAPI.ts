import { callApi } from './callAPI';
import { usageEndpoints } from './api';

export const syncYesterdayUsageAPI = async (usageData: any) => {
    return await callApi({
        method: 'POST',
        url: usageEndpoints.sync,
        body: usageData,
        showErrorToast: false, // Background task, don't show toast to user
    });
};
