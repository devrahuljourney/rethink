import { callApi } from './callAPI';
import { coachEndpoints } from './api';

export const getInsightsAPI = async () => {
    return await callApi({
        method: 'GET',
        url: coachEndpoints.insights,
    });
};
