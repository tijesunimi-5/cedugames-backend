import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import routes from './routes/index'

dotenv.config();

const app = express();
app.use(express.json())
const port = process.env.PORT || 8000;

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
