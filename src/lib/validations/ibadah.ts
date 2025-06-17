import { z } from 'zod'

export const ibadahTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama ibadah wajib diisi')
    .min(2, 'Nama ibadah minimal 2 karakter')
    .max(100, 'Nama ibadah maksimal 100 karakter'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  trackingType: z.enum(['checklist', 'count'], {
    required_error: 'Jenis pelacakan wajib dipilih',
  }),
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    required_error: 'Frekuensi wajib dipilih',
  }),
  targetCount: z
    .number()
    .min(1, 'Target minimal 1')
    .max(1000, 'Target maksimal 1000')
    .optional(),
  unit: z
    .string()
    .max(50, 'Satuan maksimal 50 karakter')
    .optional(),
  scheduleType: z.enum(['always', 'date_range', 'specific_dates'], {
    required_error: 'Jenis jadwal wajib dipilih',
  }).default('always'),
  startDate: z
    .string()
    .optional(),
  endDate: z
    .string()
    .optional(),
  specificDates: z
    .array(z.string())
    .optional(),
}).refine((data) => {
  // If tracking type is count, unit should be provided
  if (data.trackingType === 'count' && !data.unit) {
    return false;
  }
  return true;
}, {
  message: 'Satuan wajib diisi untuk jenis pelacakan hitung',
  path: ['unit'],
}).refine((data) => {
  // If schedule type is date_range, both start and end dates should be provided
  if (data.scheduleType === 'date_range' && (!data.startDate || !data.endDate)) {
    return false;
  }
  return true;
}, {
  message: 'Tanggal mulai dan akhir wajib diisi untuk jadwal rentang tanggal',
  path: ['startDate'],
}).refine((data) => {
  // If schedule type is specific_dates, specific dates should be provided
  if (data.scheduleType === 'specific_dates' && (!data.specificDates || data.specificDates.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Tanggal spesifik wajib diisi untuk jadwal tanggal tertentu',
  path: ['specificDates'],
})

export const ibadahRecordSchema = z.object({
  ibadahTypeId: z.string().min(1, 'ID ibadah wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  isCompleted: z.boolean().optional(),
  countValue: z
    .number()
    .min(0, 'Nilai tidak boleh negatif')
    .max(1000, 'Nilai maksimal 1000')
    .optional(),
  notes: z
    .string()
    .max(500, 'Catatan maksimal 500 karakter')
    .optional(),
})

export const reportFilterSchema = z.object({
  dateFrom: z.string().min(1, 'Tanggal mulai wajib diisi'),
  dateTo: z.string().min(1, 'Tanggal akhir wajib diisi'),
  ibadahTypes: z.array(z.string()).optional(),
  filterType: z.enum(['daily', 'monthly', 'yearly']).optional(),
})

export const muhasabahEntrySchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  goodThings: z
    .string()
    .min(1, 'Hal baik wajib diisi')
    .max(1000, 'Maksimal 1000 karakter'),
  improvements: z
    .string()
    .min(1, 'Hal yang bisa ditingkatkan wajib diisi')
    .max(1000, 'Maksimal 1000 karakter'),
  prayersHopes: z
    .string()
    .min(1, 'Doa atau harapan wajib diisi')
    .max(1000, 'Maksimal 1000 karakter'),
  mood: z
    .enum(['very_happy', 'happy', 'neutral', 'sad', 'very_sad'])
    .optional(),
})

export type IbadahTypeFormData = z.infer<typeof ibadahTypeSchema>
export type IbadahRecordFormData = z.infer<typeof ibadahRecordSchema>
export type ReportFilterFormData = z.infer<typeof reportFilterSchema>
export type MuhasabahEntryFormData = z.infer<typeof muhasabahEntrySchema>
