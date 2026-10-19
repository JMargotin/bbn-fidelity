// Crée un compte STAFF (livreur) pour l'espace /admin.
// Run with: npm run create-staff -- <email> <password> [nom]
//
// Un STAFF accède au scan, aux clients et au QR camion. Les écrans réservés au
// gérant (récompenses, concours, notifications, stats) restent masqués — voir
// src/app/(admin)/layout.tsx. Pour un compte gérant : npm run create-owner.

// Must be the first import: loads env vars before prisma/auth read them.
import "./load-env";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run create-staff -- <email> <password> [nom]");
    process.exit(1);
  }

  // better-auth handles password hashing and the User/Account rows.
  const result = await auth.api.signUpEmail({
    body: { email, password, name: name ?? email.split("@")[0] },
  });
  if (!result?.user) throw new Error("Signup failed");

  // Le rôle par défaut est déjà STAFF ; on confirme l'email pour permettre la
  // connexion immédiate, comme le fait create-owner.
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "STAFF", emailVerified: true, mustChangePassword: false },
  });

  console.log(`Created STAFF ${email} (id=${result.user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
