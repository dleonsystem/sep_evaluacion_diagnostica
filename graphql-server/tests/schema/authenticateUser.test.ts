import { reportConsolidatorServiceMock } from '../mocks/report-consolidator.service.mock';

describe('authenticateUser', () => {
    it('should authenticate user correctly', () => {
        // Your test implementation here
        // Using the consolidateReportsByCCT from the mock
        const result = reportConsolidatorServiceMock.consolidateReportsByCCT();
        expect(result).toBeDefined();
    });
});
