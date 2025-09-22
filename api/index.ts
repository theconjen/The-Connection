import serverless from "serverless-http";
import app from "../server/app";

// Export default handler for Vercel Serverless Functions
export default serverless(app as any);
