import { z } from 'zod'
export const UserId = z.coerce.number().int().positive()
