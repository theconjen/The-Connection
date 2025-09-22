import serverless from "serverless-http";
import app from "../server/app";

// Export handler for Vercel Serverless Functions
const handler = serverless(app as any);

export { handler };
