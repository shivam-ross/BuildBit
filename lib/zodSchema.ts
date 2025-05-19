import { z } from 'zod';

export const createSchema = z.object({
    prompt: z.string(),
})

export const editSchema = z.object({
    prompt: z.string(),
    html: z.string(),
});