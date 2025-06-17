import { z } from 'zod'

export const supportMessageSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subjek wajib diisi')
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  message: z
    .string()
    .min(1, 'Pesan wajib diisi')
    .min(10, 'Pesan minimal 10 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter'),
})

export const adminReplySchema = z.object({
  adminReply: z
    .string()
    .min(1, 'Balasan wajib diisi')
    .min(10, 'Balasan minimal 10 karakter')
    .max(2000, 'Balasan maksimal 2000 karakter'),
  status: z.enum(['open', 'in_progress', 'closed'], {
    required_error: 'Status wajib dipilih',
  }),
})

export type SupportMessageFormData = z.infer<typeof supportMessageSchema>
export type AdminReplyFormData = z.infer<typeof adminReplySchema>
