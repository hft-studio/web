BEGIN;

select plan(10);

-- Create test users
SELECT tests.create_supabase_user('wallet_owner');
SELECT tests.create_supabase_user('wallet_viewer');

-----------
-- Acting as wallet_owner
-----------
SELECT tests.authenticate_as('wallet_owner');

-- Test 1: Owner can create their wallet
SELECT results_eq(
    $$ 
    INSERT INTO public.wallets (user_id, wallet_id, encrypted_seed) 
    VALUES (tests.get_supabase_uid('wallet_owner'), 'wallet123', 'encrypted_data_123') 
    RETURNING user_id::text 
    $$,
    $$ 
    SELECT tests.get_supabase_uid('wallet_owner')::text
    $$,
    'Wallet owner can create their wallet'
);

-- Test 2: Owner can view their wallet
SELECT results_eq(
    $$ 
    SELECT wallet_id::text 
    FROM public.wallets 
    WHERE user_id = tests.get_supabase_uid('wallet_owner') 
    $$,
    $$ 
    SELECT 'wallet123'::text
    $$,
    'Wallet owner can view their wallet'
);

-- Test 3: Owner cannot update their wallet
SELECT is_empty(
    $$ 
    UPDATE public.wallets 
    SET encrypted_seed = 'new_encrypted_data_456' 
    WHERE user_id = tests.get_supabase_uid('wallet_owner')
    RETURNING 1 
    $$,
    'Wallet owner cannot update their wallet'
);

-- Test 4: Owner cannot delete their wallet
SELECT is_empty(
    $$ 
    DELETE FROM public.wallets 
    WHERE user_id = tests.get_supabase_uid('wallet_owner')
    RETURNING 1 
    $$,
    'Wallet owner cannot delete their wallet'
);

-----------
-- Acting as wallet_viewer
-----------
SELECT tests.authenticate_as('wallet_viewer');

-- Test 5: Other user cannot create wallet for owner
SELECT throws_ok(
    $$ 
    INSERT INTO public.wallets (user_id, wallet_id, encrypted_seed) 
    VALUES (tests.get_supabase_uid('wallet_owner'), 'wallet456', 'encrypted_data_789') 
    $$,
    'new row violates row-level security policy for table "wallets"'
);

-- Test 6: Other user cannot see owner's wallet
SELECT is_empty(
    $$ 
    SELECT * 
    FROM public.wallets 
    WHERE user_id = tests.get_supabase_uid('wallet_owner') 
    $$,
    'Other users cannot view wallet owner''s wallet'
);

-----------
-- Acting as anon
-----------
SELECT tests.clear_authentication();

-- Test 7: Anon cannot view wallets
SELECT is_empty(
    $$ 
    SELECT * 
    FROM public.wallets 
    $$,
    'Anonymous users cannot view wallets'
);

-- Test 8: Anon cannot create wallets
SELECT throws_ok(
    $$ 
    INSERT INTO public.wallets (user_id, wallet_id, encrypted_seed) 
    VALUES (tests.get_supabase_uid('wallet_owner'), 'wallet789', 'encrypted_data_xyz') 
    $$,
    'new row violates row-level security policy for table "wallets"'
);

-- Test 9: Anon cannot update wallets
SELECT is_empty(
    $$ 
    UPDATE public.wallets 
    SET encrypted_seed = 'hacked_data' 
    RETURNING 1 
    $$,
    'Anonymous users cannot update wallets'
);

-- Test 10: Anon cannot delete wallets
SELECT is_empty(
    $$ 
    DELETE FROM public.wallets 
    RETURNING 1 
    $$,
    'Anonymous users cannot delete wallets'
);

SELECT * FROM finish();
ROLLBACK; 