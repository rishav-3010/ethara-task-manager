import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let dbReady;

export default async function handler(req, res) {
  dbReady ||= connectDB(process.env.MONGODB_URI);
  await dbReady;
  return app(req, res);
}
