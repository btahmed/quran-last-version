sed -i 's/const signInWithPassword = vi.fn();/const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));/' tests/unit/services/supabase-auth.test.js
sed -i 's/tracker.wizToggleHizb(1);/tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, "hizb:1");/' tests/unit/pages/RevisionPage.test.js
