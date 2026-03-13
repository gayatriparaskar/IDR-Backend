require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.ESIGN_API_KEY;
const PROFILE_ID = process.env.PROFILE_ID;

app.post("/create-esign", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: "Missing required fields: name, email, phone" 
      });
    }
    const pdf = fs.readFileSync("./Master-Agreement-Kanchan-Palace-2.pdf");
    const base64File = pdf.toString("base64");

    const payload = {
      profileId: PROFILE_ID,
      file: {
        name: "Master-Agreement-Kanchan-Palace-2.pdf",
        file: base64File,
      },
      invitees: [
        {
          name: name,
          email: email,
          phone: phone,
        },
      ],
    };
    console.log("TOKEN:", TOKEN);
    console.log("PROFILE_ID:", PROFILE_ID);
    const response = await axios.post(
      
      "https://app1.leegality.com/api/v3.0/sign/request",
      payload,
      {
        headers: {
          "X-Auth-Token": TOKEN,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("TOKEN:", TOKEN);
    console.log("PROFILE_ID:", PROFILE_ID);
    res.json(response.data);
    console.log(response.data, "data");
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).send("Error creating eSign request");
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});