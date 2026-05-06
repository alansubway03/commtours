create table if not exists public.referral_click (
  id bigint generated always as identity primary key,
  ref_id text not null unique,
  partner text not null default 'commtours',
  tour_id bigint not null references public.tour(id) on delete cascade,
  agency_name text not null,
  vendor text not null default 'unknown',
  target_url text not null,
  clicked_at timestamptz not null default now(),
  ip_address text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists referral_click_agency_clicked_idx
  on public.referral_click(agency_name, clicked_at desc);

create index if not exists referral_click_tour_clicked_idx
  on public.referral_click(tour_id, clicked_at desc);

create table if not exists public.referral_conversion (
  id bigint generated always as identity primary key,
  ref_id text not null references public.referral_click(ref_id) on delete cascade,
  agency_booking_id text not null,
  status text not null check (status in ('paid', 'unpaid', 'cancelled')),
  paid_amount numeric(12,2),
  paid_at timestamptz,
  departure_date date,
  settlement_month text not null,
  source_file text not null default '',
  imported_at timestamptz not null default now(),
  unique (ref_id, agency_booking_id)
);

create index if not exists referral_conversion_settlement_idx
  on public.referral_conversion(settlement_month, status);
