import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { toCountryCategory } from "@/lib/reviewTaxonomy";

type TourRow = {
  id: number;
  title: string | null;
  agency: string | null;
  destination: string | null;
};

async function ensureDemoMembers() {
  const supabase = createSupabaseAdminClient();
  const seeds = [
    {
      email: "demo.review1@commtours.local",
      tel: "+852 9000 0001",
      member_name: "DemoA01",
    },
    {
      email: "demo.review2@commtours.local",
      tel: "+852 9000 0002",
      member_name: "DemoB02",
    },
    {
      email: "demo.review3@commtours.local",
      tel: "+852 9000 0003",
      member_name: "DemoC03",
    },
    {
      email: "demo.review4@commtours.local",
      tel: "+852 9000 0004",
      member_name: "DemoD04",
    },
  ];

  const ids: string[] = [];
  for (const seed of seeds) {
    const { data: existing, error: findErr } = await supabase
      .from("member_account")
      .select("id")
      .eq("email", seed.email)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing?.id) {
      ids.push(existing.id);
      continue;
    }

    const { data: created, error: createErr } = await supabase
      .from("member_account")
      .insert({
        email: seed.email,
        tel: seed.tel,
        member_name: seed.member_name,
        password_hash: "demo-seeded-not-for-login",
        weekly_promo_subscribed: false,
      })
      .select("id")
      .single();
    if (createErr || !created?.id) throw createErr ?? new Error("建立 demo 會員失敗");
    ids.push(created.id);
  }
  return ids;
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const { data: tours, error: tourErr } = await supabase
    .from("tour")
    .select("id, title, agency, destination")
    .order("id", { ascending: true })
    .limit(300);
  if (tourErr) throw tourErr;

  const allTours = (tours ?? []) as TourRow[];
  const pickedTours: TourRow[] = [];
  const usedAgencies = new Set<string>();
  for (const tour of allTours) {
    const agency = (tour.agency ?? "").trim();
    if (!agency || usedAgencies.has(agency)) continue;
    usedAgencies.add(agency);
    pickedTours.push(tour);
    if (pickedTours.length >= 4) break;
  }
  if (pickedTours.length < 4) {
    throw new Error("tour 資料不足，至少需要 4 間不同旅行社才能建立 4 筆 demo 評論。");
  }

  const [memberA, memberB, memberC, memberD] = await ensureDemoMembers();
  const now = new Date().toISOString();

  const demoRows = [
    {
      source_tour_id: pickedTours[0].id,
      agency: pickedTours[0].agency ?? "旅行社",
      destination_category: toCountryCategory(pickedTours[0].destination ?? ""),
      group_code: "DEMO-A100",
      member_id: memberA,
      reviewer_display_name: "Demo旅人A",
      itinerary_rating: 5,
      meal_rating: 4,
      hotel_rating: 4,
      guide_rating: 5,
      value_rating: 4,
      will_rebook: true,
      comment: "行程節奏好，景點安排順，工作人員照顧細心，整體值得推薦。",
      extra_info: `[提交來源] ${pickedTours[0].agency ?? "旅行社"} / Demo`,
      participation_proof: "團號 DEMO-A100",
      base_fee_hkd: 22999,
      optional_activity_fee_hkd: 1800,
      staff_service_fee_hkd: 1200,
      moderation_status: "approved",
      moderated_at: now,
      moderation_note: "demo seed updated",
      updated_at: now,
    },
    {
      source_tour_id: pickedTours[1].id,
      agency: pickedTours[1].agency ?? "旅行社",
      destination_category: toCountryCategory(pickedTours[1].destination ?? ""),
      group_code: "DEMO-B200",
      member_id: memberB,
      reviewer_display_name: "Demo旅人B",
      itinerary_rating: 4,
      meal_rating: 3,
      hotel_rating: 4,
      guide_rating: 4,
      value_rating: 4,
      will_rebook: false,
      comment: "景點內容不錯，住宿穩定，膳食一般，整體中上。",
      extra_info: `[提交來源] ${pickedTours[1].agency ?? "旅行社"} / Demo`,
      participation_proof: "團號 DEMO-B200",
      base_fee_hkd: 18980,
      optional_activity_fee_hkd: 2200,
      staff_service_fee_hkd: 950,
      moderation_status: "approved",
      moderated_at: now,
      moderation_note: "demo seed updated",
      updated_at: now,
    },
    {
      source_tour_id: pickedTours[2].id,
      agency: pickedTours[2].agency ?? "旅行社",
      destination_category: toCountryCategory(pickedTours[2].destination ?? ""),
      group_code: "DEMO-C300",
      member_id: memberC,
      reviewer_display_name: "Demo旅人C",
      itinerary_rating: 5,
      meal_rating: 4,
      hotel_rating: 5,
      guide_rating: 5,
      value_rating: 5,
      will_rebook: true,
      comment: "行程完整、節奏舒適，工作人員專業，會再報名。",
      extra_info: `[提交來源] ${pickedTours[2].agency ?? "旅行社"} / Demo`,
      participation_proof: "團號 DEMO-C300",
      base_fee_hkd: 26800,
      optional_activity_fee_hkd: 1500,
      staff_service_fee_hkd: 1300,
      moderation_status: "approved",
      moderated_at: now,
      moderation_note: "demo seed new",
      updated_at: now,
    },
    {
      source_tour_id: pickedTours[3].id,
      agency: pickedTours[3].agency ?? "旅行社",
      destination_category: toCountryCategory(pickedTours[3].destination ?? ""),
      group_code: "DEMO-D400",
      member_id: memberD,
      reviewer_display_name: "Demo旅人D",
      itinerary_rating: 4,
      meal_rating: 4,
      hotel_rating: 3,
      guide_rating: 4,
      value_rating: 4,
      will_rebook: true,
      comment: "自由活動安排佳，住宿可再提升，但整體仍然滿意。",
      extra_info: `[提交來源] ${pickedTours[3].agency ?? "旅行社"} / Demo`,
      participation_proof: "團號 DEMO-D400",
      base_fee_hkd: 17200,
      optional_activity_fee_hkd: 2600,
      staff_service_fee_hkd: 900,
      moderation_status: "approved",
      moderated_at: now,
      moderation_note: "demo seed new",
      updated_at: now,
    },
  ];

  for (const row of demoRows) {
    const { data: existing, error: findErr } = await supabase
      .from("agency_review")
      .select("id")
      .eq("agency", row.agency)
      .eq("group_code", row.group_code)
      .eq("member_id", row.member_id)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing?.id) {
      const { error: updateErr } = await supabase.from("agency_review").update(row).eq("id", existing.id);
      if (updateErr) throw updateErr;
      continue;
    }

    const { error: insertErr } = await supabase.from("agency_review").insert(row);
    if (insertErr) throw insertErr;
  }

  console.log(
    "Demo 評論已寫入：",
    `${pickedTours[0].id} ${pickedTours[0].title ?? ""}`,
    "|",
    `${pickedTours[1].id} ${pickedTours[1].title ?? ""}`,
    "|",
    `${pickedTours[2].id} ${pickedTours[2].title ?? ""}`,
    "|",
    `${pickedTours[3].id} ${pickedTours[3].title ?? ""}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
