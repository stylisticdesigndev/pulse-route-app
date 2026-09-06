import { createServerFn } from "@tanstack/react-start";

const DEMO_EMAIL = "driver@apexmove.internal";
const DEMO_NAME = "Marcus Vance";

/**
 * Provisions (once) the seeded demo courier account, makes sure the active
 * route is assigned to it, and returns a single-use token the client exchanges
 * for a real Supabase session. No password ever leaves the server.
 */
export const startDemoCourierSession = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  let user = list.users.find((candidate) => candidate.email === DEMO_EMAIL) ?? null;

  if (!user) {
    const password = crypto.randomUUID() + crypto.randomUUID();
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, demo: true },
    });
    if (createError) throw createError;
    user = created.user;
  }
  if (!user) throw new Error("Could not provision the demo courier account.");

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: user.id,
      full_name: DEMO_NAME,
      role: "field_technician" as const,
      vehicle_identifier: "Van #408",
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  // Point the live manifest at the demo courier so RLS lets them see it.
  const { data: routes, error: routeError } = await supabaseAdmin
    .from("routes")
    .select("id")
    .in("status", ["active", "assigned"])
    .order("scheduled_date", { ascending: false })
    .limit(1);
  if (routeError) throw routeError;
  if (routes?.[0]) {
    await supabaseAdmin.from("routes").update({ driver_id: user.id }).eq("id", routes[0].id);
  }

  // Claim the seeded demo records so owner-scoped policies allow them through.
  await supabaseAdmin.from("drivers").update({ user_id: user.id }).is("user_id", null);
  await supabaseAdmin.from("shifts").update({ driver_user_id: user.id }).is("driver_user_id", null);

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_EMAIL,
  });
  if (linkError) throw linkError;

  const tokenHash = link.properties?.hashed_token;
  if (!tokenHash) throw new Error("Could not create a demo session token.");

  return { tokenHash, email: DEMO_EMAIL };
});
