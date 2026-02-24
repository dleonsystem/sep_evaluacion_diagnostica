export const HEALTH_CHECK_QUERY = `
  query HealthCheck {
    healthCheck {
      status
      timestamp
    }
  }
`;

export const GET_DASHBOARD_METRICS = `
  query GetDashboardMetrics {
    getDashboardMetrics {
      totalUsuarios
      usuariosActivos
      totalTickets
      ticketsAbiertos
      ticketsResueltos
      totalSolicitudes
      solicitudesValidadas
      totalCCTs
    }
  }
`;

export const EXPORT_TICKETS_CSV = `
  query ExportTicketsCSV {
    exportTicketsCSV {
      success
      fileName
      contentBase64
    }
  }
`;
export const GET_SOLICITUDES = `
  query GetSolicitudes($cct: String, $limit: Int, $offset: Int) {
    getSolicitudes(cct: $cct, limit: $limit, offset: $offset) {
      id
      consecutivo
      cct
      archivoOriginal
      fechaCarga
      estadoValidacion
      nivelEducativo
      archivoPath
      archivoSize
      procesadoExternamente
      resultados {
        nombre
        url
        size
      }
    }
  }
`;

export const DOWNLOAD_ASSESSMENT_RESULT = `
  query DownloadAssessmentResult($solicitudId: ID!, $fileName: String!) {
    downloadAssessmentResult(solicitudId: $solicitudId, fileName: $fileName) {
      success
      fileName
      contentBase64
    }
  }
`;
