# Admin Passcode Guide

This app stores the shared admin passcode as a SHA-256 hash in the `competitions.admin_passcode_hash` column.

Important:

- admins type the plain passphrase into the login form
- the database stores only the hash
- changing `.env` alone does not rotate the passcode for an existing production competition

## Rotate The Production Passcode

1. Pick a new plain-text passphrase.

2. Generate its SHA-256 hash:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-new-passphrase').digest('hex'))"
```

3. In the Supabase SQL Editor, update the live competition row:

```sql
update competitions
set admin_passcode_hash = 'PASTE_NEW_SHA256_HASH_HERE'
where slug = 'summer-2026';
```

After that, the new plain-text passphrase is the password admins should use.

## Clear A Login Cooldown

If repeated failed attempts triggered rate limiting, clear the cooldown with:

```sql
delete from admin_login_attempts
where competition_slug = 'summer-2026';
```

## Change The Default Demo Passcode

For fresh seeded environments, the default demo passcode comes from either:

- `GO_DEMO_ADMIN_PASSCODE`
- or `DEMO_ADMIN_PASSCODE` in [src/lib/constants.ts](/home/roman/dev-env/guy_olympics/src/lib/constants.ts)

That only affects newly seeded demo competitions. It does not update an existing production competition row.
