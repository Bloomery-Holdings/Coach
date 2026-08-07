# Coach

A personal training coach. One user. Runs on your phone, offline, with your data
on your device.

---

## Putting it live — no terminal needed

### 1. Make the repository

Go to **github.com** → **New repository**. Name it `coach`. Set it **Private**.
Do **not** tick "Add a README" — this folder already has one. Click
**Create repository**.

### 2. Upload these files

On the new empty repository page, click **uploading an existing file**.

Drag in **everything from this folder**: `index.html`, `package.json`,
`vite.config.js`, `README.md`, `.gitignore`, and the `src`, `public` and
`.github` folders.

> If `.github` doesn't appear when you drag, it is hidden.
> **Mac:** press `Cmd + Shift + .` in Finder to show hidden files.
> **Windows:** File Explorer → View → tick "Hidden items".
> Without it there is no automatic deployment.

Click **Commit changes**.

### 3. Switch on Pages

In the repository: **Settings** → **Pages** → under *Build and deployment*,
set **Source** to **GitHub Actions**. Nothing else to change.

### 4. Wait two minutes

Open the **Actions** tab. A job called *Deploy Coach* runs by itself. When the
tick goes green, your app is live at:

```
https://YOUR-USERNAME.github.io/coach/
```

### 5. Put it on your phone

Open that address in Chrome. Menu (⋮) → **Add to Home screen**.

You now have an icon that opens full-screen, works with no signal, and keeps
your data on the phone.

---

## First run, in order

1. **Settings → Sample data → Clear the sample data.** Do this before anything
   else. Demo history would otherwise be read as your own logging, and the
   coach would design next month from fiction.
2. **Settings → Inputs → Import WHOOP data.** Unzip your WHOOP export first,
   then pick `physiological_cycles.csv`, `sleeps.csv` and `workouts.csv`.
3. **Start logging.** The checklist on Today walks you through what's needed and
   why. Everything on it can be done where it sits.

---

## Changing it later

Edit any file directly on github.com — click the file, click the pencil, commit.
The Actions job rebuilds and the live app updates within a minute. Reopen it on
your phone and it refreshes itself.

To move data between devices: **Settings → Your data → Back up my data**, copy
the text, and paste it into **Restore** on the other device.

---

## What needs no key, and what does

Everything works offline and without any account: the daily prescription, all 21
calculations, the programme, measurements, WHOOP import, backup.

Only the coach's **chat** calls the Anthropic API. Paste a key into
Settings → Coach if you want it. Nothing else depends on it.

---

## If something breaks

Open the live site on a laptop, press **F12**, click **Console**, and read the
first red line. That one line usually identifies the problem exactly.

The app stores everything under the key `coach:data` in the browser's local
storage. Clearing site data wipes it — back up first.
