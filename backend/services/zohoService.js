const axios = require("axios")

async function getEmployees(accessToken){

  const response = await axios.get(
    "https://people.zoho.in/people/api/forms/employee/getRecords",
    {
      headers:{
        Authorization:`Zoho-oauthtoken ${accessToken}`
      }
    }
  )

  return response.data.response.result
}

module.exports = { getEmployees }