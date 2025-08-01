admin_sessions table:
create table public.admin_sessions (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  session_token character varying(255) not null,
  expires_at timestamp with time zone not null default (now() + '24:00:00'::interval),
  last_activity timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint admin_sessions_pkey primary key (id),
  constraint admin_sessions_session_token_key unique (session_token),
  constraint admin_sessions_admin_id_fkey foreign KEY (admin_id) references admin_users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_token on public.admin_sessions using btree (session_token) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_admin_id on public.admin_sessions using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_admin_sessions_expires_at on public.admin_sessions using btree (expires_at) TABLESPACE pg_default;

admin_users table:
create table public.admin_users (
  id uuid not null default gen_random_uuid (),
  username character varying(255) not null,
  email character varying(255) null,
  password_hash character varying(255) not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  last_login timestamp with time zone null,
  constraint admin_users_pkey primary key (id),
  constraint admin_users_email_key unique (email),
  constraint admin_users_username_key unique (username)
) TABLESPACE pg_default;

create index IF not exists idx_admin_users_username on public.admin_users using btree (username) TABLESPACE pg_default;

create index IF not exists idx_admin_users_email on public.admin_users using btree (email) TABLESPACE pg_default;

bank_accounts table:
create table public.bank_accounts (
  id uuid not null default gen_random_uuid (),
  bank_name character varying(255) not null,
  account_number character varying(100) not null,
  holder_name character varying(255) not null,
  bank_limit integer null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bank_accounts_pkey primary key (id)
) TABLESPACE pg_default;

free_credits_redemptions table:
create table public.free_credits_redemptions (
  id uuid not null default gen_random_uuid (),
  phone text not null,
  user_id uuid null,
  credits_awarded integer null default 100,
  redeemed_at timestamp with time zone null default now(),
  redemption_type character varying(50) null default 'welcome_bonus'::character varying,
  created_at timestamp with time zone null default now(),
  constraint free_credits_redemptions_pkey primary key (id),
  constraint unique_phone_redemption unique (phone),
  constraint free_credits_redemptions_user_id_fkey foreign KEY (user_id) references wager_wave_users (id)
) TABLESPACE pg_default;

create index IF not exists idx_free_credits_phone on public.free_credits_redemptions using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_free_credits_user_id on public.free_credits_redemptions using btree (user_id) TABLESPACE pg_default;

game_transactions table:
create table public.game_transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  game_type character varying(50) not null,
  bet_amount integer not null,
  result_amount integer not null,
  game_result character varying(20) null,
  game_data jsonb null,
  created_at timestamp with time zone null default now(),
  net_change integer null default 0,
  points_before integer null default 0,
  points_after integer null default 0,
  constraint game_transactions_pkey primary key (id),
  constraint game_transactions_user_id_fkey foreign KEY (user_id) references wager_wave_users (id) on delete CASCADE
) TABLESPACE pg_default;

referral_records table:
create table public.referral_records (
  id uuid not null default gen_random_uuid (),
  referrer_id uuid not null,
  referred_user_id uuid not null,
  referred_username character varying(255) not null,
  registration_date timestamp with time zone null default now(),
  total_commission_earned integer null default 50,
  last_topup_amount integer null,
  last_topup_date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint referral_records_pkey primary key (id),
  constraint unique_referral unique (referred_user_id),
  constraint referral_records_referred_user_id_fkey foreign KEY (referred_user_id) references wager_wave_users (id) on delete CASCADE,
  constraint referral_records_referrer_id_fkey foreign KEY (referrer_id) references wager_wave_users (id) on delete CASCADE
) TABLESPACE pg_default;

referral_sessions table:
create table public.referral_sessions (
  id uuid not null default gen_random_uuid (),
  phone text not null,
  referral_code text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  used boolean null default false,
  expires_at timestamp with time zone null default (now() + '24:00:00'::interval),
  constraint referral_sessions_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_referral_sessions_phone on public.referral_sessions using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_referral_sessions_active on public.referral_sessions using btree (phone, used, expires_at) TABLESPACE pg_default;

create unique INDEX IF not exists idx_unique_phone_active on public.referral_sessions using btree (phone) TABLESPACE pg_default
where
  (used = false);

topup_records table:
create table public.topup_records (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  username character varying(255) not null,
  amount integer not null,
  referrer_id uuid null,
  commission_paid integer null default 0,
  created_at timestamp with time zone null default now(),
  points_before integer null default 0,
  points_after integer null default 0,
  vip_status_changed boolean null default false,
  constraint topup_records_pkey primary key (id),
  constraint topup_records_referrer_id_fkey foreign KEY (referrer_id) references wager_wave_users (id),
  constraint topup_records_user_id_fkey foreign KEY (user_id) references wager_wave_users (id) on delete CASCADE,
  constraint topup_records_amount_check check ((amount >= 10))
) TABLESPACE pg_default;

wager_wave_users table:
create table public.wager_wave_users (
  id uuid not null default gen_random_uuid (),
  username text not null,
  phone text null,
  password_hash text not null,
  is_active boolean null default true,
  login_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_login timestamp with time zone null,
  points integer null default 0,
  is_vip boolean null default false,
  rank character varying(50) null default 'Bronze'::character varying,
  referred_by uuid null,
  status character varying(20) null default 'active'::character varying,
  referral_code character varying(20) null,
  last_activity timestamp with time zone null default now(),
  constraint wager_wave_users_pkey primary key (id),
  constraint unique_phone unique (phone),
  constraint wager_wave_users_referral_code_key unique (referral_code),
  constraint wager_wave_users_username_key unique (username),
  constraint wager_wave_users_referred_by_fkey foreign KEY (referred_by) references wager_wave_users (id)
) TABLESPACE pg_default;

create index IF not exists idx_wager_wave_users_username on public.wager_wave_users using btree (username) TABLESPACE pg_default;

create index IF not exists idx_wager_wave_users_phone on public.wager_wave_users using btree (phone) TABLESPACE pg_default;