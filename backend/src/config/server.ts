import express from "express";
import cors from "cors";

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Backend is running on localhost:9000");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
