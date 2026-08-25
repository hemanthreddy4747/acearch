const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Allow the server to understand JSON data
app.use(express.json());

// Serve our frontend files
app.use(express.static(path.join(__dirname, "../public")));

app.listen(PORT, () => {
    console.log(`AceArch is running at http://localhost:${PORT}`);
});