// Bootstrap the first OWNER user. Run with: npm run create-owner
//
// NOTE: this script was not present in the deployed image (Next.js standalone
// build doesn't trace scripts/). Reconstructed here from the package.json
// `create-owner` entry, the Prisma schema (User has `role: OWNER | STAFF`,
// `mustChangePassword: boolean`), and the better-auth config in src/lib/auth.ts.
// If the original behaviour differs, adjust accordingly.

// Must be the first import: loads env vars before prisma/auth read them.
import "./load-env";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run create-owner -- <email> <password> [name]");
    process.exit(1);
  }

  // better-auth handles password hashing and the User/Account rows.
  const result = await auth.api.signUpEmail({
    body: { email, password, name: name ?? email.split("@")[0] },
  });
  if (!result?.user) throw new Error("Signup failed");

  // Promote to OWNER (the API path can't set role: input:false in auth.ts).
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "OWNER", emailVerified: true, mustChangePassword: false },
  });

  console.log(`Created OWNER ${email} (id=${result.user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
