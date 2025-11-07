import { z } from 'zod/v4'
export const UserId = z.coerce.number().int().positive()
