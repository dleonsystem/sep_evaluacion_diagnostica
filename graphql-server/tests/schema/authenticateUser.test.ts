// Mock implementation to include consolidateReportsByCCT in the report-consolidator.service mock

jest.mock('../services/report-consolidator.service', () => ({
  consolidateReportsByCCT: jest.fn(),
}));