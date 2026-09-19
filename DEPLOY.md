# Putting NexusTrace online

The plan: one small Azure server runs everything (both websites and the API), Caddy in front of it gives you HTTPS, and a free `.me` domain points at it. Total cost is ₹0 if you use the student credits.

Do part 1 first. Approval can take a few days, and everything else waits on it.

## 1. Get the free things

1. **GitHub Student Developer Pack**: https://education.github.com/pack. Sign in with your GitHub account and apply. You need your college email or a photo of your student ID. Your GitHub profile name should match your ID, and your browser must be allowed to share its location while you apply.
   Approval is quick, but the **partner offers (Azure, Namecheap) only unlock 72 hours (3 days) after approval**. GitHub shows "Awaiting Benefits" until then. Azure won't verify you before that, so wait for the message to change, and you'll get an email too. If nothing has unlocked after 5 days, post in the [GitHub Education community](https://github.com/orgs/community/discussions/categories/github-education).
2. When the benefits unlock, the pack page lists the offers. Claim two:
   - **Namecheap: a free `.me` domain for 1 year.** Pick a name, e.g. `nexustrace.me`.
   - **Microsoft Azure for Students: $100 credit.** No credit card needed. It is the credit that pays for the server. Start from the Azure offer on the pack page (not by searching for Azure yourself) and sign in with a Microsoft account. GitHub and Microsoft check students separately, so being approved by GitHub is not enough on its own until the offer has unlocked. If Azure still can't verify you, its other route is your college email or a manual review that can take 3 to 5 working days.

## 2. Create the server on Azure

Sign in at https://portal.azure.com with the Azure for Students account.

**First, find which regions you may use.** Student accounts are limited to a handful of regions and the list is different for everyone. Search for **Policy** in the top bar → **Authoring → Assignments** → open **Allowed resource deployment regions** → look at the *Allowed locations* parameter. Pick one from that list.

Then **Create a resource → Virtual machine**:

| Setting | Value |
|---|---|
| Resource group | Create new: `nexustrace-rg` |
| Virtual machine name | `nexustrace` |
| Region | One from your allowed list |
| Image | **Ubuntu Server 24.04 LTS - x64 Gen2** |
| Size | Try **Standard_B2ats_v2** (2 vCPU, 1 GiB, about $7/month). If it isn't listed or gives a quota error, try **Standard_B2ts_v2**, then **Standard_B1ms** (2 GiB, about $15/month). |
| Authentication | **SSH public key**, username `azureuser`, key pair name `nexustrace-key` |
| Public inbound ports | **Allow selected ports: SSH (22), HTTP (80), HTTPS (443)** |

Click **Review + create → Create**. When it asks, **download the private key** (`nexustrace-key.pem`). You can't get it again, so keep it safe and never put it in the project folder.

When it finishes, open the VM and note its **Public IP address**.

> If Azure refuses to create any VM in any allowed region (this happens to some student accounts), tell me. The fallback is a cheap DigitalOcean server, and the same scripts work there.

## 3. Point the domain at the server

In Namecheap: **Domain List → Manage → Advanced DNS → Add new record**:

- Type **A Record**, Host `@`, Value = the VM's public IP, TTL Automatic.
- Delete any other default `A` or `URL redirect` record on `@` (parking page).

Check it worked (it can take from a minute to an hour), in PowerShell:

```powershell
nslookup yourdomain.me
```

The answer must show your VM's IP.

## 4. Connect to the server

In PowerShell on your PC (change the path). The first two lines make Windows accept the key file:

```powershell
icacls "C:\path\to\nexustrace-key.pem" /inheritance:r
icacls "C:\path\to\nexustrace-key.pem" /grant:r "$($env:USERNAME):R"
ssh -i "C:\path\to\nexustrace-key.pem" azureuser@VM_IP_ADDRESS
```

Type `yes` the first time. The prompt changes to `azureuser@nexustrace:~$`. Everything below runs there.

## 5. Get the code onto the server

The GitHub repository is private, so give the server its own read-only key:

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/nexustrace_deploy
cat ~/.ssh/nexustrace_deploy.pub
```

Copy the line it prints. On GitHub open the `nexustrace` repository → **Settings → Deploy keys → Add deploy key**, paste it, leave *Allow write access* **unticked**, save. Back on the server:

```bash
export GIT_SSH_COMMAND="ssh -i ~/.ssh/nexustrace_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
git clone git@github.com:lnfernoAnnoys/nexustrace.git
cd nexustrace
git config core.sshCommand "ssh -i ~/.ssh/nexustrace_deploy -o IdentitiesOnly=yes"
```

(The code has to be pushed to GitHub first. Ask me to commit and push if you haven't.)

## 6. Install and start everything

```bash
sudo bash deploy/setup-server.sh yourdomain.me
```

This takes about 5–10 minutes. It installs Node 22 and Caddy, builds the site, and starts it. Caddy fetches the HTTPS certificate automatically, which only works once the domain from part 3 points at the server.

Then create your first administrator:

```bash
npm run user -- create head.dept 'pick-a-long-password' --name "Your Name" --admin --level 8
```

Open `https://yourdomain.me/admin/` and sign in. You'll set up the authenticator app on first login, exactly like on your PC. Investigators use `https://yourdomain.me/`.

## Everyday commands (on the server)

| Do this | Command |
|---|---|
| See what the site is printing | `sudo journalctl -u nexustrace -f` (Ctrl+C to stop) |
| Restart the site | `sudo systemctl restart nexustrace` |
| Update after you push new code | `cd ~/nexustrace && bash deploy/update.sh` |
| Change settings (e.g. close sign-up) | `sudo nano /etc/nexustrace.env`, then restart |
| Make/remove admins, change levels | `cd ~/nexustrace && npm run user -- make-admin <id>` (see README) |
| If the certificate fails | `sudo journalctl -u caddy -n 50` |

## Before you show it to anyone

- **Back up** `~/nexustrace/server/data/` (the database **and** `app.key`; without the key every authenticator has to be set up again). To copy it to your PC, on the server: `sudo systemctl stop nexustrace && tar czf ~/backup.tgz -C ~/nexustrace server/data && sudo systemctl start nexustrace`, then on your PC: `scp -i key.pem azureuser@VM_IP:backup.tgz .`
- **Sign-up** is open by default. Set `SIGNUP_OPEN=false` in `/etc/nexustrace.env` and restart if only people you create should get in.
- **Tell everyone to upload dummy ID files.** Documents are encrypted at rest, but a hackathon server is the wrong place for real Aadhaar cards.
- Don't share the `.pem` key or the `nexustrace.env` file.

## If something doesn't work

- **The page doesn't load, or the browser warns about the certificate.** The certificate is only issued once the domain points at the server and ports 80 and 443 are open. Check that `nslookup yourdomain.me` shows the VM's IP, that the VM's **Networking** tab in Azure lists inbound rules for 80 and 443, and read `sudo journalctl -u caddy -n 50`.
- **You get a Caddy page or "502".** The site itself isn't running: `sudo systemctl status nexustrace` and `sudo journalctl -u nexustrace -n 50`.
- **Login does nothing.** Login cookies need HTTPS, so open the site through `https://yourdomain.me`, not the IP address.
- **Build runs out of memory.** Run `free -h` and check the swap line isn't 0. Re-run `sudo bash deploy/setup-server.sh yourdomain.me`, or pick the 2 GiB VM size.

## When the hackathon is over

Delete the **resource group** `nexustrace-rg` in the Azure portal. That removes the server, its disk and its IP, and stops the credit being used.
