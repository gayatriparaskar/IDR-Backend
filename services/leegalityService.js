const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.sendToLeegality = async (filePath, name, email, phone, id) => {
  try {
    console.log("Reading PDF from:", filePath);
    
    // Use absolute path
    const absolutePath = path.resolve(filePath);
    const pdf = fs.readFileSync(absolutePath);
    const base64File = pdf.toString("base64");

    const payload = {
      profileId: process.env.PROFILE_ID,
      file: {
        name: `agreement-${id}.pdf`,
        file: base64File
      },
      invitees: [
        {
          name,
          email,
          phone
        }
      ]
    };

    console.log("Sending to Leegality API...");
    console.log("PROFILE_ID:", process.env.PROFILE_ID);
    console.log("API_URL:", process.env.ESIGN_API_URL);

    const response = await axios.post(
      process.env.ESIGN_API_URL,
      payload,
      {
        headers: {
          "X-Auth-Token": process.env.ESIGN_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("Leegality Response:", response.data);
    
    return {
      success: true,
      data: response.data,
      

    };

  } catch (error) {
    console.error("Leegality API error:", error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};