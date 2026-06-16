import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

const UpsertCustomerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  phoneInput: z.string().min(1, "Phone is required"),
});

export async function upsertCustomer(input: { firstName: string; phoneInput: string }) {
  const { firstName, phoneInput } = UpsertCustomerSchema.parse(input);
  const phoneE164 = normalizePhone(phoneInput);

  const existing = await prisma.customer.findUnique({ where: { phoneE164 } });
  if (existing) return existing;

  return prisma.customer.create({ data: { firstName, phoneE164 } });
}
