// One-off: move base64 avatars out of user_metadata into Storage.
// Usage: npx ts-node scripts/migrateAvatars.ts [--apply]   (dry run without --apply)
import 'dotenv/config';
import getSupabaseAdmin from '../config/supabaseAdmin';
import { uploadAvatarDataUrl } from '../utils/avatar';

const apply = process.argv.includes('--apply');

async function main() {
  let page = 1;
  let migrated = 0;

  while (true) {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    for (const user of data.users) {
      const avatar = user.user_metadata?.avatar_url;
      if (typeof avatar !== 'string' || !avatar.startsWith('data:')) continue;

      console.log(`${apply ? 'Migrating' : 'Would migrate'} ${user.id} (${avatar.length} chars)`);
      if (!apply) continue;

      const url = await uploadAvatarDataUrl(user.id, avatar);
      const { error: updateError } = await getSupabaseAdmin().auth.admin.updateUserById(user.id, {
        user_metadata: { avatar_url: url },
      });
      if (updateError) throw updateError;
      console.log(`  -> ${url}`);
      migrated++;
    }

    if (data.users.length < 100) break;
    page++;
  }

  console.log(apply ? `Done, migrated ${migrated} user(s).` : 'Dry run only. Re-run with --apply.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
