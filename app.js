const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

//routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const brandRoutes = require("./routes/brandRoutes");
const designerRoutes = require("./routes/designerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customOrderRoutes = require("./routes/customOrderRoutes");
const chatRoutes = require('./routes/chatRoutes');

app.use(cors());
app.options("*", cors);

app.use(bodyParser.json());
app.use(morgan("tiny"));
dotenv.config();
const api = process.env.API_URL;

app.use(`${api}/products`, productRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/brands`, brandRoutes);
app.use(`${api}/designers`, designerRoutes);
app.use(`${api}/orders`, orderRoutes);
app.use(`${api}/custom-orders`, customOrderRoutes);
app.use(`${api}/chat`, chatRoutes);

app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

mongoose
  .connect(process.env.CONNECTION_STRING, {
    dbName: "pak-style",
  })
  .then(() => {
    console.log("Database connection is ready");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

