# How to Deploy Phantom Bard

This guide will walk you through putting Phantom Bard on the internet so anyone can play it. There are **3 things** to deploy:

1. **Frontend** -- The website itself (goes to Cloudflare)
2. **Multiplayer Server** -- The real-time game rooms (goes to PartyKit on Cloudflare)
3. **AI Dungeon Master** -- The AI brain that narrates the story (goes to Supabase)

---

## Before You Start

You need these accounts (all free to sign up):

| Account | Why | Sign Up |
|---|---|---|
| **Cloudflare** | Hosts the website + multiplayer | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) |
| **PartyKit** | Manages multiplayer rooms (uses your Cloudflare account) | [partykit.io](https://partykit.io) |
| **Supabase** | Hosts the AI Dungeon Master function | [supabase.com](https://supabase.com) |
| **GitHub** | Stores your code (optional but recommended) | [github.com](https://github.com) |

You also need **Node.js** installed on your computer. Get it from [nodejs.org](https://nodejs.org) (pick the LTS version, the one on the left).

> **Not sure if you have Node.js?** Open your terminal (Command Prompt on Windows, Terminal on Mac) and type `node -v`. If you see a version number like `v20.x.x`, you're good.

---

## Step 1: Get the Code Ready

Open your terminal and run these commands one at a time:

```bash
# Download the code
git clone https://github.com/luandro/phantom-bard.git
cd phantom-bard

# Install everything the project needs
npm install
```

> **Using Bun?** If you prefer [Bun](https://bun.sh), run `bun install` instead. Both work fine.

---

## Step 2: Set Up Your Environment Variables

Environment variables are like secret settings that tell your app where to find things.

### 2a. Create your config file

```bash
cp .env.example .env
```

This creates a file called `.env`. You'll fill it in as you complete the next steps.

### 2b. Get your Supabase keys

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"** and give it a name (like "phantom-bard")
3. Set a database password and pick a region close to you
4. Wait for the project to finish setting up (about 2 minutes)
5. Once it's ready, go to **Settings** (gear icon) > **API**
6. You'll see two important things:
   - **Project URL** -- looks like `https://abc123.supabase.co`
   - **anon public** key -- a long string of letters and numbers

Write these down or keep this tab open. You'll need them in Step 5.

### 2c. Get your Cloudflare credentials

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign in
2. In the terminal, log in to Wrangler (Cloudflare's deploy tool):

```bash
npx wrangler login
```

3. A browser window will pop up asking you to authorize Wrangler. Click **Allow**.

### 2d. Log in to PartyKit

In the terminal, run:

```bash
npx partykit login
```

A browser window will pop up. Authorize it. This connects PartyKit to your Cloudflare account.

---

## Step 3: Deploy the AI Dungeon Master (Supabase)

This is the brain that narrates your D&D adventure.

### 3a. Install the Supabase CLI

```bash
# Mac
brew install supabase/tap/supabase

# Windows (in PowerShell)
powershell -c "irm https://supabase.com/install-cli.ps1 | iex"

# Linux
curl -sSfL https://supabase.com/install-cli.sh | sh
```

### 3b. Link to your Supabase project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with the ID from your project URL. For example, if your URL is `https://abc123.supabase.co`, your project ID is `abc123`.

### 3c. Set the AI secret

The AI DM needs an API key to talk to an AI model. You can use OpenAI, Google Gemini, or another provider.

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

> **Don't have an OpenAI key?** Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys), sign up, and create one. You'll need to add a payment method (OpenAI charges per use, but it's very cheap for text).

### 3d. Deploy the function

```bash
supabase functions deploy dm-chat
```

You should see a success message with a URL. The AI DM is now live!

---

## Step 4: Deploy the Multiplayer Server (PartyKit)

This handles real-time game rooms so friends can play together.

In the terminal, run:

```bash
npm run party:deploy
```

You'll see output that looks something like:

```
Deployed phantom-bard to https://phantom-bard.YOUR-USERNAME.partykit.dev
```

**Write down this URL.** You'll need it for the next step.

---

## Step 5: Fill In Your `.env` File

Now you have all the pieces. Open the `.env` file in any text editor and fill it in:

```env
# Supabase (from Step 2b)
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# PartyKit (from Step 4 -- use the URL you got after deploying)
VITE_PARTYKIT_HOST=phantom-bard.YOUR-USERNAME.partykit.dev
```

Replace the example values with your real ones (copy the PartyKit URL exactly from the deploy output). Save the file.

---

## Step 6: Deploy the Website (Cloudflare Workers)

This puts your app on the internet where everyone can visit it.

### 6a. Build the app

```bash
npm run build
```

This creates a production-ready version of your app. Wait for it to finish (about 30 seconds).

### 6b. Deploy to Cloudflare

```bash
npx wrangler deploy
```

You'll see output like:

```
Published tanstack-start-app (x.xx sec)
  https://tanstack-start-app.YOUR-USERNAME.workers.dev
```

**That's your website URL!** Open it in a browser and you should see Phantom Bard.

---

## Step 7: Test It

1. Open your deployed website URL in a browser
2. Try creating a solo campaign -- the AI DM should respond
3. If you have a friend, try creating a multiplayer party

If everything works, you're done! Your app is live on the internet.

---

## Updating Later

When you make changes to the code, just repeat the deploy steps:

```bash
# 1. Build the new version
npm run build

# 2. Deploy the website
npx wrangler deploy

# 3. If you changed the multiplayer server:
npm run party:deploy

# 4. If you changed the AI DM function:
supabase functions deploy dm-chat
```

---

## Setting a Custom Domain (Optional)

Want to use your own website address like `phantombard.com` instead of the `.workers.dev` URL?

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Add your domain to Cloudflare (follow the setup wizard)
3. Go to **Workers & Pages** > your worker > **Settings** > **Domains & Routes**
4. Click **Add** > **Custom Domain** and type your domain
5. Cloudflare will handle the rest automatically

---

## Troubleshooting

### "Command not found: wrangler" or "Command not found: partykit"

Use `npx` before the command:
```bash
npx wrangler deploy
npx partykit deploy
```

### The website loads but the AI DM doesn't respond

- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your `.env` file are correct
- Make sure you deployed the `dm-chat` function: `supabase functions deploy dm-chat`
- Make sure you set the AI API key secret: `supabase secrets list`

### Multiplayer doesn't work

- Check that `VITE_PARTYKIT_HOST` in your `.env` file matches your deployed PartyKit URL
- Make sure you ran `npm run build` **after** updating the `.env` file (the values get baked into the build)
- Redeploy: `npm run build && npx wrangler deploy`

### Build fails with errors

- Make sure you ran `npm install` first
- Try deleting `node_modules` and running `npm install` again:
  ```bash
  rm -rf node_modules
  npm install
  npm run build
  ```

### "Not authenticated" error from Wrangler

Run the login command again:
```bash
npx wrangler login
```

### PartyKit deploy fails

Log in again:
```bash
npx partykit login
```

---

## Quick Reference: All Commands

| What | Command |
|---|---|
| Install dependencies | `npm install` |
| Build the app | `npm run build` |
| Deploy website | `npx wrangler deploy` |
| Deploy multiplayer | `npm run party:deploy` |
| Deploy AI DM | `supabase functions deploy dm-chat` |
| Set AI secret | `supabase secrets set OPENAI_API_KEY=your-key` |
| Log in to Cloudflare | `npx wrangler login` |
| Log in to PartyKit | `npx partykit login` |
| Log in to Supabase | `supabase login` |
