import fetch from 'node-fetch';

async function testGraphQL() {
    console.log('--- Testing GraphQL Endpoint ---');
    const query = `
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
          tendenciaCargas {
            fecha
            cantidad
          }
          distribucionNivel {
            label
            cantidad
            porcentaje
          }
          eficienciaSoporte {
            tiempoPromedioRespuestaHoras
            tasaResolucion
          }
        }
      }
    `;

    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const result = await response.json();
        if (result.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
        } else {
            console.log('✅ Success! Data received:');
            console.log(JSON.stringify(result.data.getDashboardMetrics, null, 2));
        }
    } catch (err) {
        console.error('❌ Fetch failed:', err.message);
    }
}

testGraphQL();
