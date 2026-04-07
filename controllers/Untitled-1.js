require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

const TOKEN = process.env.ESIGN_API_KEY;
const PROFILE_ID = process.env.PROFILE_ID;

app.get("/create-esign", async (req, res) => {
  try {
    const pdf = fs.readFileSync("./agreement.pdf");
    const base64File = pdf.toString("base64");

    const payload = {
      profileId: PROFILE_ID,
      file: {
        name: "agreement.pdf",
        file: base64File,
      },
      invitees: [
        {
          name: "Test User",
          email: "test@gmail.com",
          phone: "9876543210",
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