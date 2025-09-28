import { z } from "zod";
const UserId = z.coerce.number().int().positive();
export {
  UserId
};
