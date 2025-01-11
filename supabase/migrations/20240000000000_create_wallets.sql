-- Create wallets table
create sequence "public"."wallets_id_seq";

create table "public"."wallets" (
    "id" integer not null default nextval('wallets_id_seq'::regclass),
    "wallet_id" character varying(255) not null,
    "encrypted_seed" text not null,
    "user_id" uuid
);

alter sequence "public"."wallets_id_seq" owned by "public"."wallets"."id";

CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);

alter table "public"."wallets" add constraint "wallets_pkey" PRIMARY KEY using index "wallets_pkey";

alter table "public"."wallets" add constraint "wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."wallets" validate constraint "wallets_user_id_fkey";

-- Grant access to the table (needed for RLS to work)
grant all on public.wallets to authenticated;
grant all on public.wallets to anon;
grant all on public.wallets_id_seq to authenticated;
grant all on public.wallets_id_seq to anon;

-- Enable RLS (this denies all operations by default)
alter table "public"."wallets" enable row level security;

-- Only create policies for operations we want to allow
create policy "Users can view their own wallet"
    on public.wallets
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own wallet"
    on public.wallets
    for insert
    with check (auth.uid() = user_id); 