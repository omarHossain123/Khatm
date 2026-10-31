# IRC Khatm Reflections

An anonymous discussion board for Western IRC's khatm. Every surah has its own board, grouped by
Sheikh Adnan's 12 clusters. Members post and reply anonymously using a join code shared in the group
chat. The admin can edit all themes, pin reflection questions, delete anything, and review reports.

Stack: React + Vite (frontend), Supabase (database and admin login). Both run on free tiers.

## 1. Set up Supabase (free)

1. Create an account at https://supabase.com and make a **New project** (any name, e.g. `irc-khatm`).
   Save the database password somewhere, though you won't need it day-to-day.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
   This creates the tables, the security rules, and fills in all 12 cluster themes.
3. **Turn off public sign-ups** so nobody else can create an account:
   **Authentication → Sign In / Providers → Email**, then turn off **Allow new users to sign up**
   (keep the Email provider itself enabled).
4. **Create your admin login:** **Authentication → Users → Add user → Create new user**. Enter your
   email and a strong password, and tick **Auto Confirm User**.
5. **Make that user an admin:** back in the SQL Editor, run (with your email):
   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
6. **Set the join code** (default is `khatm`). You can change it later from the admin page, or now:
   ```sql
   update settings set join_code = 'your-code' where id = 1;
   ```
7. Go to **Project Settings → API** (or **API Keys**) and copy the **Project URL** and the
   **anon / publishable** key. These are safe to put in the website; the security rules protect the data.
   Never use the `service_role` / secret key in the site.

## 2. Run it locally (optional)

```bash
cp .env.example .env     # then paste your URL and key into .env
npm install
npm run dev              # opens at http://localhost:5173
```

## 3. Deploy (free)

**Vercel** (or Netlify, which works the same way):

1. Push this folder to a GitHub repo.
2. On https://vercel.com, click **Add New → Project** and import the repo. It detects Vite automatically.
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Click **Deploy**. Share the link in the group chat along with the join code. Members enter the
   code the first time they post, and their device remembers it after that.

The site uses `#/` URLs (e.g. `/#/surah/2`), so no extra routing setup is needed on any host.

## Using the admin side

Click **Admin login** at the top right. While you're signed in:

- **Home page:** Edit the welcome text, the Mufassal intro, and every cluster theme.
- **Surah page:** Add or edit the surah's theme. Post as the "Khatm team." Tick
  **Pin as a reflection question** to pin your questions at the top. Pin, unpin, or delete any post,
  and delete any reply.
- **Admin page:** Review reported posts (delete or dismiss) and change the join code.

## Good to know

- **Anonymity:** Posts store no name, email, or account. Supabase keeps standard server request logs,
  but the site never shows or records who posted what.
- **Free-tier pausing:** Supabase pauses free projects after about a week with **no activity at all**.
  During the khatm this won't happen. If it does (e.g. over a break), open the Supabase dashboard
  and click **Restore**. No data is lost.
- **Changing the join code** immediately stops the old code from working. Members are asked for the
  new one the next time they post.
