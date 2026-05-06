const { Client } = require('pg');
require('dotenv').config();

const allPermissions = [
  'access_admin_panel',
  'view_dashboard_metrics',
  'manage_system_settings',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'reset_user_passwords',
  'upload_assessment_data',
  'validate_assessment_data',
  'view_upload_history',
  'delete_upload_records',
  'view_all_reports',
  'download_results_pdf',
  'generate_consolidated_reports',
  'export_data_csv',
  'view_support_tickets',
  'respond_support_tickets',
  'manage_faq',
  'manage_school_catalog',
  'publish_materials'
];

const buildPermissions = (allowedKeys) => {
  const perms = {};
  allPermissions.forEach(key => {
    perms[key] = allowedKeys.includes(key);
  });
  return perms;
};

const rolesConfig = {
  COORDINADOR_FEDERAL: buildPermissions(allPermissions),
  COORDINADOR_ESTATAL: buildPermissions([
    'access_admin_panel',
    'view_dashboard_metrics',
    'view_users',
    'create_users',
    'edit_users',
    'reset_user_passwords',
    'upload_assessment_data',
    'validate_assessment_data',
    'view_upload_history',
    'view_all_reports',
    'download_results_pdf',
    'generate_consolidated_reports',
    'export_data_csv',
    'view_support_tickets',
    'respond_support_tickets',
    'manage_faq',
    'manage_school_catalog',
    'publish_materials'
  ]),
  RESPONSABLE_CCT: buildPermissions([
    'access_admin_panel',
    'view_dashboard_metrics',
    'upload_assessment_data',
    'view_upload_history',
    'download_results_pdf'
  ]),
  CONSULTA: buildPermissions([
    'access_admin_panel',
    'view_dashboard_metrics',
    'view_upload_history',
    'view_all_reports',
    'download_results_pdf'
  ])
};

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Iniciando Seeding de Permisos ---');

    for (const [codigo, permisos] of Object.entries(rolesConfig)) {
      console.log(`Actualizando permisos para: ${codigo}...`);
      await client.query(
        'UPDATE cat_roles_usuario SET permisos = $1 WHERE codigo = $2',
        [JSON.stringify(permisos), codigo]
      );
    }

    console.log('--- Seeding completado con éxito ---');
  } catch (err) {
    console.error('Error durante el seeding:', err);
  } finally {
    await client.end();
  }
}

run();
