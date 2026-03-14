const axios = require('axios');
const logger = require('../utils/logger');

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid Zoho access token, refreshing if needed
 */
async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  try {
    const response = await axios.post(
      'https://accounts.zoho.in/oauth/v2/token',
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      }
    );

    cachedAccessToken = response.data.access_token;
    // Zoho tokens expire in 3600s, cache for 3500s
    tokenExpiresAt = Date.now() + 3500 * 1000;
    logger.info('Zoho access token refreshed');
    return cachedAccessToken;
  } catch (error) {
    logger.error('Failed to refresh Zoho token', { error: error.response?.data || error.message });
    throw new Error('Zoho authentication failed');
  }
}

/**
 * Fetch all employees from Zoho People
 */
async function fetchEmployees() {
  try {
    const accessToken = await getAccessToken();
    const response = await axios.get(
      'https://people.zoho.in/people/api/forms/employee/getRecords',
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          sIndex: 1,
          limit: 200,
        },
      }
    );

    logger.info('Fetched employees from Zoho', { count: Object.keys(response.data).length });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch Zoho employees', { error: error.response?.data || error.message });
    throw error;
  }
}

/**
 * Fetch a single employee by Zoho record ID
 */
async function fetchEmployeeById(recordId) {
  try {
    const accessToken = await getAccessToken();
    const response = await axios.get(
      `https://people.zoho.in/people/api/forms/employee/getDataByID`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          recordId,
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch Zoho employee', { recordId, error: error.response?.data || error.message });
    throw error;
  }
}

/**
 * Sync Zoho employee data into PostgreSQL
 */
async function syncToPostgres(db) {
  try {
    const zohoData = await fetchEmployees();

    if (!zohoData || typeof zohoData !== 'object') {
      logger.warn('No employee data returned from Zoho');
      return { synced: 0 };
    }

    const results = zohoData.response?.result;
    if (!Array.isArray(results)) {
      logger.warn('Unexpected Zoho response structure');
      return { synced: 0 };
    }

    let syncCount = 0;

    for (const recordObj of results) {
      // Each recordObj has a single key (the record ID) mapping to an array of size 1
      const recordArray = Object.values(recordObj)[0];
      if (!recordArray || !recordArray[0]) continue;
      
      const empData = recordArray[0];

      const name = empData['FirstName']
        ? `${empData['FirstName']} ${empData['LastName'] || ''}`.trim()
        : empData['EmployeeID'] || 'Unknown';

      const email = empData['EmailID'] || '';
      const department = empData['Department'] || '';
      const role = empData['Designation'] || empData['Role'] || '';
      const manager = empData['Reporting_To'] || '';
      // Strip out the appended numbers from manager name e.g. "Jay Gajjar 1" -> "Jay Gajjar"
      const cleanManager = manager.replace(/\s+\d+$/, '').trim();
      const employeeId = empData['EmployeeID'] || '';
      const zohoRecordId = empData['Zoho_ID'] || '';

      if (!email) continue;

      await db.query(
        `INSERT INTO employees (name, email, department, role, reporting_manager, employee_id, hrms_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           department = EXCLUDED.department,
           role = EXCLUDED.role,
           reporting_manager = EXCLUDED.reporting_manager,
           hrms_id = EXCLUDED.hrms_id,
           updated_at = NOW()`,
        [name, email, department, role, cleanManager, employeeId, zohoRecordId]
      );

      syncCount++;
    }

    logger.info('Zoho sync complete', { synced: syncCount });
    return { synced: syncCount };
  } catch (error) {
    logger.error('Zoho sync failed', { error: error.message });
    throw error;
  }
}

/**
 * Create a new employee record in Zoho People (Backward Sync)
 */
async function createEmployee(data) {
  try {
    const accessToken = await getAccessToken();
    
    // Convert our flat data to Zoho's expected field names
    const firstName = data.name.split(' ')[0];
    const lastName = data.name.split(' ').slice(1).join(' ') || '-';

    const response = await axios.post(
      'https://people.zoho.in/people/api/forms/employee/addRecord',
      null,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          xmlData: `
            <Record>
              <field name="FirstName">${firstName}</field>
              <field name="LastName">${lastName}</field>
              <field name="EmailID">${data.email}</field>
              <field name="Department">${data.department || ''}</field>
              <field name="Designation">${data.role || ''}</field>
              <field name="EmployeeID">${data.employeeId || ''}</field>
              <field name="Reporting_To">${data.reportingManager || ''}</field>
              <field name="Date_of_joining">${data.joinDate || ''}</field>
            </Record>
          `,
        },
      }
    );

    logger.info('Employee sync-back to Zoho attempted', { email: data.email, status: response.data.response?.status });
    return response.data;
  } catch (error) {
    logger.error('Failed to sync-back Zoho employee', { email: data.email, error: error.response?.data || error.message });
    return null;
  }
}

module.exports = { getAccessToken, fetchEmployees, fetchEmployeeById, syncToPostgres, createEmployee };
