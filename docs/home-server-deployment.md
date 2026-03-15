# Gym Journal Home Server Deployment Guide

A complete, beginner-friendly walkthrough for running your personal Gym Journal app on an old Ubuntu laptop — accessible from anywhere, for free, and secured against common attacks.

---

## Table of Contents

1. [What You'll End Up With](#1-what-youll-end-up-with)
2. [What You Need Before Starting](#2-what-you-need-before-starting)
3. [Concepts to Understand First](#3-concepts-to-understand-first)
4. [Step 1 — Prepare Ubuntu Server](#step-1--prepare-ubuntu-server)
5. [Step 2 — Harden SSH Access](#step-2--harden-ssh-access)
6. [Step 3 — Configure the Firewall (UFW)](#step-3--configure-the-firewall-ufw)
7. [Step 4 — Install Docker and Docker Compose](#step-4--install-docker-and-docker-compose)
8. [Step 5 — Install Fail2ban](#step-5--install-fail2ban)
9. [Step 6 — Set Up Free Dynamic DNS (DuckDNS)](#step-6--set-up-free-dynamic-dns-duckdns) *(non-Starlink)*
10. [Step 7 — Forward Ports on Your Router](#step-7--forward-ports-on-your-router) *(non-Starlink)*
11. [Step 7 (Starlink) — Remote Access Without Port Forwarding](#step-7-starlink--remote-access-without-port-forwarding) *(Starlink only)*
12. [Step 8 — Install Caddy (Reverse Proxy + Auto HTTPS)](#step-8--install-caddy-reverse-proxy--auto-https) *(non-Starlink only)*
13. [Step 9 — Clone the Repo and Configure Environment](#step-9--clone-the-repo-and-configure-environment)
14. [Step 10 — Deploy Gym Journal with Docker Compose](#step-10--deploy-gym-journal-with-docker-compose)
15. [Step 11 — Create Your Account and Verify Access](#step-11--create-your-account-and-verify-access)
16. [Step 12 — Install the App on Your Phone and Computers](#step-12--install-the-app-on-your-phone-and-computers)
17. [Step 13 — Keep Everything Updated](#step-13--keep-everything-updated)
18. [Troubleshooting](#troubleshooting)
19. [Security Checklist](#security-checklist)

---

## 1. What You'll End Up With

By the end of this guide:

- **Gym Journal running on an Ubuntu machine** — either a dedicated "home server" (e.g. an old laptop) or the same computer you use daily
- Your workout logs, body metrics, and exercise history **accessible from anywhere** — phone, tablet, laptop, any browser
- The app is a **Progressive Web App (PWA)**: you can install it to your phone's home screen and it behaves like a native app

**If you have a normal ISP (non-Starlink):**

- A **free custom domain** like `yourname.duckdns.org` pointing to your home server
- **Automatic HTTPS** via Let's Encrypt and Caddy (free, auto-renewing) — the app requires HTTPS for full PWA functionality
- **Port forwarding** on your router so the internet can reach your server

**If you have Starlink:**

- **No port forwarding or public IP** — Starlink uses CGNAT and doesn't offer traditional port forwarding
- Remote access via **Tailscale** (private mesh VPN): only your devices can reach the app at `http://100.x.x.x:3000`. No public URL, no HTTPS setup needed
- PWA "install to home screen" works on HTTP over Tailscale on most devices

**For everyone:**

- **PostgreSQL database** storing all your data, persisted in a Docker volume so it survives restarts and updates
- **Fail2ban** blocking brute-force login attempts
- **UFW firewall** blocking everything except what you explicitly allow
- **Hardened SSH** so only you can log into the server
- Automatic database migrations on container startup — no manual schema work

**Cost: $0.** Everything used here is free and open source.

---

## 2. What You Need Before Starting

### Deployment option: same computer or dedicated server?

This guide supports two setups:

| Option | Description | When to use it |
|--------|-------------|----------------|
| **Dedicated server** | One machine runs Gym Journal 24/7 (e.g. an old laptop). You use a *different* computer for daily work. | Best if you have spare hardware; server can stay on and out of the way. |
| **Same computer** | The machine you use every day (desktop or laptop) also runs the server. | Best if you have only one computer or prefer not to leave another device on. |

The steps are the same in both cases. Where they differ (SSH, port checks), the guide gives **both** options.

### Hardware

- **If using a dedicated server:** The old Ubuntu laptop (your home server) — plugged into power and ethernet if possible — plus your regular computer for setup.
- **If using the same computer:** One Ubuntu machine that will be both your daily driver and the server.
- **Non-Starlink only:** Your router (you'll log into its admin page once for port forwarding). **Starlink:** The guide uses Tailscale instead.

### Accounts to Create Now (all free)

| Path | Accounts |
|------|----------|
| **Non-Starlink** | [DuckDNS](https://www.duckdns.org) — free dynamic DNS. Sign in with Google/GitHub/Reddit. |
| **Starlink** | [Tailscale](https://tailscale.com) — sign in with Google/GitHub/Microsoft. No domain needed. |

### Knowledge Assumed
- You know how to open a terminal
- You can copy/paste commands
- You've used `sudo` before

Everything else is explained as we go.

---

## 3. Concepts to Understand First

Read this section — it will make the rest of the guide make sense.

### What is a home server?
It's just a computer that serves files or apps to other devices. That can be a dedicated machine (e.g. an old laptop running 24/7) or the same computer you use daily. "Server" just means "a computer that serves things to other computers."

### What is Docker?
Docker is a tool that runs apps inside isolated containers. Instead of installing Node.js, PostgreSQL, and all their dependencies directly on your system, Docker wraps each service in a self-contained box. This makes it:
- Easy to install and uninstall
- Easy to update
- Unlikely to conflict with other software on your machine

This app uses two containers: one for the Next.js web app, one for the PostgreSQL database.

### What is a Reverse Proxy?
**Non-Starlink:** When someone connects from the internet, they hit your public IP on port 443 (HTTPS). A **reverse proxy** (we use Caddy) receives that request, handles HTTPS, and forwards it to Gym Journal running locally on port 3000. You don't expose the app directly; Caddy sits in front of it.

**Starlink:** You won't run Caddy (no public IP). Tailscale gives your devices secure access to the app without a reverse proxy.

### What is Dynamic DNS?
**Non-Starlink:** Your home internet has an IP address (like `98.234.11.45`) that changes periodically. A domain like `yourname.duckdns.org` points to your current IP; DuckDNS updates it automatically.

**Starlink:** Many Starlink connections use **CGNAT** (Carrier-Grade NAT): you don't get a unique public IP, so the internet can't connect *in* to your home. Port forwarding and dynamic DNS won't help. Instead you use **Tailscale**: a private mesh so your devices reach each other over an encrypted tunnel. Only devices you add to Tailscale can reach your server.

### What is a Firewall?
UFW (Uncomplicated Firewall) is software on your server that blocks all network traffic except what you explicitly allow (like SSH and HTTPS).

### What is Fail2ban?
Fail2ban watches your server's logs. If an IP address tries to log in and fails too many times, Fail2ban temporarily blocks that IP. This defeats brute-force attacks on both SSH and the Gym Journal login page.

### What is NextAuth?
NextAuth is the authentication library built into Gym Journal. It handles user accounts, sessions, and login. It requires a secret key (`NEXTAUTH_SECRET`) and the public URL it's running at (`NEXTAUTH_URL`) to work correctly — if these are wrong, logins will fail with cryptic errors. This guide walks you through setting them correctly.

---

## Step 1 — Prepare Ubuntu Server

The "server" is the machine that will run Gym Journal. That can be a dedicated box (e.g. an old laptop) or the same Ubuntu computer you use every day.

### 1.1 Install Ubuntu Server (or Ubuntu Desktop in headless mode)

If Ubuntu isn't installed yet: download **Ubuntu 24.04 LTS** from [ubuntu.com](https://ubuntu.com/download/server) and install it. During setup, enable **OpenSSH server** when prompted.

If Ubuntu is already installed, continue.

### 1.2 Update Everything

Log into the server machine directly (keyboard + screen) or via SSH from another computer, then run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

This updates all system packages. Do this before anything else.

### 1.3 Set a Static Local IP Address

Your router assigns your server a local IP (e.g. `192.168.1.105`). That can change. Set it to be permanent so nothing breaks.

**Do one of the following** based on how your server is connected:

| Connection | Use |
|------------|-----|
| **Ethernet** | Option A (netplan) |
| **WiFi** | Option B (NetworkManager) |

Find your current local IP and interface first:

```bash
ip addr show
```

Look for a line like `inet 192.168.1.105/24` under your interface (WiFi: often `wlan0`, `wlp0s20f3`; ethernet: often `eth0`, `enp3s0`). Note that IP and the interface name.

---

#### Option A: Ethernet — Static IP via Netplan

When the server is on **ethernet**, netplan typically manages the interface. Edit the netplan config:

```bash
ls /etc/netplan/
```

Edit the config file (e.g. `00-installer-config.yaml`):

```bash
sudo vim /etc/netplan/00-installer-config.yaml
```

Use this (replace `enp3s0` with your interface name from `ip addr show`, and adjust IPs):

```yaml
network:
  version: 2
  ethernets:
    enp3s0:           # Replace with your interface name
      dhcp4: no
      addresses:
        - 192.168.1.105/24
      routes:
        - to: default
          via: 192.168.1.1   # Your router's IP
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
```

Apply and verify:

```bash
sudo netplan apply
ip addr show
```

---

#### Option B: WiFi — Static IP via NetworkManager

When the server is on **WiFi**, Ubuntu usually lets **NetworkManager** manage the interface. Use `nmcli` instead:

List connections and note the **NAME** of your WiFi connection:

```bash
nmcli con show
```

Set a static IP (replace `<your network name>` and the IPs with your values; `192.168.1.1` is usually your router):

```bash
nmcli con mod "<your network name>" \
  ipv4.addresses "192.168.1.105/24" \
  ipv4.gateway "192.168.1.1" \
  ipv4.dns "1.1.1.1,8.8.8.8" \
  ipv4.method manual

nmcli con up "<your network name>"
```

> **Tip:** To find your router's IP: run `ip route | grep default`. The IP after "via" is your router.

Verify:

```bash
ip addr show
```

You should see your chosen static IP.

---

**Note:** Ethernet is preferable for a server (fewer disconnects, lower latency), but WiFi works — just use Option B.

### 1.4 Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

When prompted, select **Yes**. This automatically installs security patches.

### 1.5 Create a Dedicated Non-Root User (if you haven't already)

Never run a server as root. If Ubuntu already asked you to create a user during install, you're fine. Otherwise:

```bash
sudo adduser gymserver
sudo usermod -aG sudo gymserver
```

When you run `adduser gymserver`, you'll be prompted to set a password (press Enter to skip the optional fields like name/room).

Log in as that user from now on. If you're at a terminal as root, switch to it with:

```bash
su - gymserver
```

---

## Step 2 — Harden SSH Access

SSH lets you log into your server from another computer. By default it uses passwords, which are vulnerable to brute-force. We'll switch to key-based authentication and disable password login entirely.

- **Dedicated server:** Run the key generation steps on your *daily* computer, then SSH into the server using the server's IP.
- **Same computer:** Run everything on that one machine; use `localhost` as the server address.

**Same computer only — do this first:** The SSH *server* must be installed and running:

```bash
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 2.1 Generate an SSH Key Pair

> **Who runs this and where:**
> - **Dedicated server:** Run on your *daily* computer (not the server). You are generating a key on the machine you will connect *from*.
> - **Same computer:** Run in your *regular user session* (your everyday login, not `gymserver`). Even though server and client are the same machine, you SSH *from* your regular user *into* the `gymserver` user.

```bash
ssh-keygen -t ed25519 -C "home-server-key"
```

Press Enter to accept the default location (`~/.ssh/id_ed25519`). Set a passphrase when prompted — this protects your key even if your computer is stolen.

### 2.2 Copy Your Public Key to the Server

> **Key terminology — critical:** There are two files. Do NOT confuse them:
> - `~/.ssh/id_ed25519` — your **private key**. Never share or copy this anywhere.
> - `~/.ssh/id_ed25519.pub` — your **public key**. This is what goes into `authorized_keys`. It is safe to share.

**Dedicated server:**

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub gymserver@192.168.1.105
```

**Same computer:**

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub gymserver@localhost
```

> **If `ssh-copy-id` fails**, copy the key manually:
> ```bash
> sudo mkdir -p /home/gymserver/.ssh
> sudo bash -c "cat $HOME/.ssh/id_ed25519.pub >> /home/gymserver/.ssh/authorized_keys"
> sudo chown -R gymserver:gymserver /home/gymserver/.ssh
> sudo chmod 700 /home/gymserver/.ssh
> sudo chmod 600 /home/gymserver/.ssh/authorized_keys
> ```

### 2.3 Test Key-Based Login

Run this from your **regular user session** (not as `gymserver`):

**Dedicated server:**

```bash
ssh gymserver@192.168.1.105
```

**Same computer:**

```bash
ssh gymserver@localhost
```

If you get a **key passphrase** prompt (not a system password), key-based auth is working.

### 2.4 Harden the SSH Configuration

On the **server**, edit the SSH config:

```bash
sudo vim /etc/ssh/sshd_config
```

Find and change (or add) these lines:

> **`AllowUsers` is critical:** This line restricts SSH logins to only the listed usernames. Set it to exactly `gymserver`. If it says anything else, SSH will reject all logins.

```
# Disable root login over SSH
PermitRootLogin no

# Disable password authentication (keys only)
PasswordAuthentication no

# Don't allow empty passwords
PermitEmptyPasswords no

# Only allow the gymserver user to log in via SSH
AllowUsers gymserver

# Reduce login grace time
LoginGraceTime 30

# Disable unused authentication methods
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
UsePAM yes
```

> **Warning:** Do NOT close your current terminal until you've confirmed login still works in a new window. If you lock yourself out, you'll need a local terminal (keyboard + screen) to fix it.

Restart SSH:

```bash
sudo systemctl restart sshd
```

Open a **new terminal window** and test that login still works (run as your regular user, not as `gymserver`):

**Dedicated server:** `ssh gymserver@192.168.1.105`

**Same computer:** `ssh gymserver@localhost`

If it works, your server now rejects all password-based SSH login attempts.

### 2.5 (Optional but Recommended) Change the SSH Port

Bots constantly scan port 22 (the default SSH port). Changing it to something random reduces this noise significantly. In `/etc/ssh/sshd_config`, add or uncomment the `Port` line:

```
Port 2222
```

**Write this number down** — you must pass `-p YOUR_PORT` in every `ssh` command from now on.

Restart SSH and test in a new terminal before closing your existing session:

```bash
sudo systemctl restart sshd
```

**Dedicated server:** `ssh -p 2222 gymserver@192.168.1.105`

**Same computer:** `ssh -p 2222 gymserver@localhost`

---

## Step 3 — Configure the Firewall (UFW)

UFW blocks all inbound traffic by default. We'll only open what's needed.

**Non-Starlink:** Open SSH and HTTP/HTTPS (for Caddy).
**Starlink:** Open SSH; open port 3000 so Tailscale clients can reach the app.

```bash
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (use your chosen port if you changed it)
sudo ufw allow 22/tcp        # Change to 2222/tcp if you changed SSH port

# Non-Starlink: allow HTTP and HTTPS (for Caddy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Starlink (Tailscale only): allow Gym Journal so Tailscale clients can reach it
# Uncomment the next line if you're on Starlink and using Tailscale:
# sudo ufw allow 3000/tcp

# Enable the firewall
sudo ufw enable
```

When prompted "Command may disrupt existing ssh connections. Proceed with operation (y|n)?", type `y`.

Check the status:

```bash
sudo ufw status verbose
```

> **Important:** If you changed your SSH port to 2222, use `sudo ufw allow 2222/tcp` instead of `22/tcp`, and remove the 22 rule: `sudo ufw delete allow 22/tcp`.

---

## Step 4 — Install Docker and Docker Compose

Docker is how this app runs — it manages both the Next.js app and the PostgreSQL database as containers.

### 4.1 Install Docker

```bash
# Remove any old versions
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Install prerequisites
sudo apt install ca-certificates curl gnupg lsb-release -y

# Add Docker's GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker's repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

### 4.2 Add Your User to the Docker Group

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 4.3 Start Docker and Enable on Boot

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 4.4 Verify Docker Works

```bash
docker run hello-world
```

You should see "Hello from Docker!" If you get *"Cannot connect to the Docker daemon"*, run the commands in **4.3** above, then try again.

---

## Step 5 — Install Fail2ban

Fail2ban monitors log files and bans IPs that repeatedly fail to authenticate.

```bash
sudo apt install fail2ban -y
```

### 5.1 Configure Fail2ban

Create a local configuration file (never edit the default — it gets overwritten on updates):

```bash
sudo vim /etc/fail2ban/jail.local
```

Paste the following:

```ini
[DEFAULT]
# Ban an IP for 1 hour after 5 failed attempts within 10 minutes
bantime  = 3600
findtime = 600
maxretry = 5

# Ignore your own local network
ignoreip = 127.0.0.1/8 192.168.1.0/24

[sshd]
enabled  = true
port     = ssh          # Change to 2222 if you changed SSH port
logpath  = %(sshd_log)s
maxretry = 3

# Non-Starlink only (Caddy access log). Starlink users: set enabled = false.
[caddy]
enabled  = true
port     = http,https
logpath  = /var/log/caddy/access.log
maxretry = 10
findtime = 60
bantime  = 600
```

Enable and start Fail2ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Check it's running:

```bash
sudo fail2ban-client status
```

---

## Step 6 — Set Up Free Dynamic DNS (DuckDNS)

**Non-Starlink:** Do this step. Your home internet IP changes periodically; DuckDNS gives you a free subdomain (`yourname.duckdns.org`) that always points to your current IP.

**Starlink:** Skip this step. Tailscale doesn't need a domain.

### 6.1 Create Your DuckDNS Subdomain

1. Go to [duckdns.org](https://www.duckdns.org) and sign in (Google, GitHub, etc.)
2. Under "add domain", type a name you want (e.g., `mygymjournal`)
3. Click **add domain**
4. Copy your **token** from the top of the page — you'll need it

Your domain is now: `mygymjournal.duckdns.org`

### 6.2 Set Up Auto-Update on the Server

DuckDNS needs to know your current IP. We'll run a small script every 5 minutes.

```bash
mkdir -p ~/duckdns
vim ~/duckdns/duck.sh
```

Paste (replace `YOUR_TOKEN` and `mygymjournal` with yours):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=mygymjournal&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

Make it executable and test it:

```bash
chmod +x ~/duckdns/duck.sh
~/duckdns/duck.sh
cat ~/duckdns/duck.log
```

You should see `OK`. Now set it to run every 5 minutes via cron:

```bash
crontab -e
```

Add this line (select vim if asked for an editor):

```
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

Save and exit. Your domain now tracks your home IP automatically.

---

## Step 7 — Forward Ports on Your Router

**Non-Starlink only.** Your router receives internet traffic and needs to know to send it to your server.

**Starlink:** Skip this entire step and go to [Step 7 (Starlink) — Remote Access Without Port Forwarding](#step-7-starlink--remote-access-without-port-forwarding). Starlink uses CGNAT so port forwarding won't work.

### 7.1 Access Your Router Admin Page

Open a browser and go to `http://192.168.1.1` (or your router's IP — found with `ip route`). Log in. Default credentials are often printed on the router's label.

> **Security tip:** Change your router's admin password if it's still the default.

### 7.2 Add Port Forwarding Rules

Look for a section called **Port Forwarding**, **NAT**, **Virtual Servers**, or similar.

Add two rules:

| Name             | External Port | Internal IP       | Internal Port | Protocol |
|------------------|--------------|-------------------|---------------|----------|
| GymJournal HTTP  | 80           | 192.168.1.105     | 80            | TCP      |
| GymJournal HTTPS | 443          | 192.168.1.105     | 443           | TCP      |

Replace `192.168.1.105` with your server's actual static IP. Save/apply the rules.

### 7.3 Verify Port Forwarding

From any device, visit [https://www.yougetsignal.com/tools/open-ports/](https://www.yougetsignal.com/tools/open-ports/) — enter your public IP and check that port 443 shows as open (after Caddy is running in the next step).

You can find your public IP at [ifconfig.me](https://ifconfig.me).

---

## Step 7 (Starlink) — Remote Access Without Port Forwarding

**Starlink only.** Use **Tailscale** — your server and your devices join a private mesh so only you can reach the app.

**On the server:**

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Follow the link printed by `tailscale up` to log in. Note your server's Tailscale IP (e.g. `100.101.102.103`) — you'll use it to open Gym Journal and for SSH from other machines.

**On each device where you want Gym Journal (phone, laptop):**

- **Phone:** Install the Tailscale app from the App Store or Play Store, log in with the same account.
- **Computer:** Install from [tailscale.com/download](https://tailscale.com/download) and log in.

**Access Gym Journal:** In a browser, use `http://100.x.x.x:3000` (replace with your server's Tailscale IP). Tailscale encrypts traffic between devices so HTTP is acceptable here.

**After this step,** continue to **Step 9 — Clone the Repo and Configure Environment**. Starlink users **skip Step 8** (Caddy).

---

## Step 8 — Install Caddy (Reverse Proxy + Auto HTTPS)

**Non-Starlink only.** Starlink users skip this step and go to Step 9.

Caddy is a web server and reverse proxy that automatically obtains and renews Let's Encrypt SSL certificates for free. HTTPS is required for the Gym Journal PWA to be fully installable on iOS and for NextAuth to work correctly in production.

### 8.1 Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update
sudo apt install caddy -y
```

### 8.2 Create Log Directory for Caddy

```bash
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
```

### 8.3 Configure Caddy

Edit the main Caddy config file:

```bash
sudo vim /etc/caddy/Caddyfile
```

Replace ALL existing content with (substituting your DuckDNS domain):

```
mygymjournal.duckdns.org {
    # Reverse proxy all traffic to Gym Journal running in Docker
    reverse_proxy localhost:3000

    # Log access (used by Fail2ban)
    log {
        output file /var/log/caddy/access.log
        format json
    }

    # Security headers
    header {
        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"
        # Prevent MIME sniffing
        X-Content-Type-Options "nosniff"
        # Enable HTTPS strictly
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        # Basic XSS protection
        X-XSS-Protection "1; mode=block"
        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"
        # Remove server header
        -Server
    }
}
```

Replace `mygymjournal.duckdns.org` with your actual DuckDNS domain.

### 8.4 Validate and Restart Caddy

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl restart caddy
sudo systemctl enable caddy
sudo systemctl status caddy
```

You should see "active (running)". Caddy will automatically obtain your Let's Encrypt certificate on first access. This requires ports 80 and 443 to be open (from Step 7).

---

## Step 9 — Clone the Repo and Configure Environment

### 9.1 Install Git

```bash
sudo apt install git -y
```

### 9.2 Clone the Repository

Log in as `gymserver` (or your server user) and clone the repo into their home directory:

```bash
cd ~
git clone https://github.com/chipkajb/gym-journal.git gym-journal
cd gym-journal
```

### 9.3 Generate the Required Secrets

Gym Journal requires two secret values. Generate them now:

```bash
# Generate NEXTAUTH_SECRET (must be at least 32 characters)
openssl rand -base64 32

# Generate a strong database password
openssl rand -base64 24
```

Copy both outputs — you'll paste them into the `.env` file in the next step.

### 9.4 Create the Environment File

Create a `.env` file at the root of the cloned repo:

```bash
vim ~/gym-journal/.env
```

Fill it in based on your setup:

**Non-Starlink:**

```env
# Database password (generated above)
POSTGRES_PASSWORD=your_generated_db_password_here

# NextAuth secret (generated above — must be 32+ characters)
NEXTAUTH_SECRET=your_generated_nextauth_secret_here

# The public URL Gym Journal is served at — must match exactly (no trailing slash)
NEXTAUTH_URL=https://mygymjournal.duckdns.org

# Production mode
NODE_ENV=production
```

**Starlink (Tailscale):**

```env
# Database password (generated above)
POSTGRES_PASSWORD=your_generated_db_password_here

# NextAuth secret (generated above — must be 32+ characters)
NEXTAUTH_SECRET=your_generated_nextauth_secret_here

# Use your server's Tailscale IP and port 3000
NEXTAUTH_URL=http://100.101.102.103:3000

# Production mode
NODE_ENV=production
```

> **Critical — `NEXTAUTH_URL`:** This must match the URL you actually use to open the app. If it doesn't match, logins will fail with a "callback URL mismatch" error. Use your DuckDNS domain (non-Starlink) or Tailscale IP with port (Starlink).

> **Security:** Keep this `.env` file private. Never commit it to git. It is already listed in `.gitignore`.

---

## Step 10 — Deploy Gym Journal with Docker Compose

### 10.1 Set Up a Production Docker Compose Override

The included `docker-compose.yml` has volume mounts designed for local development (live-reloading source code). For production, we override those to let the built Docker image run as-is. Create an override file:

```bash
vim ~/gym-journal/docker-compose.prod.yml
```

Paste:

```yaml
services:
  app:
    # Remove development volume mounts — use the built image as-is
    volumes: []

    ports:
      # Non-Starlink: only bind to localhost (Caddy proxies from outside)
      # Starlink: change to "3000:3000" so Tailscale clients can reach it
      - "127.0.0.1:3000:3000"
```

> **Starlink users:** Change `"127.0.0.1:3000:3000"` to `"3000:3000"` so that Tailscale clients on your other devices can reach the app. Only devices enrolled in your Tailscale network can connect, so this is safe.

### 10.2 Build and Start the App

This command builds the Docker image (compiles the Next.js app), starts PostgreSQL, runs database migrations, and launches everything:

```bash
cd ~/gym-journal
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The first build takes several minutes — it installs all Node.js dependencies and compiles the app. Subsequent starts are fast.

Watch the startup logs to confirm everything comes up cleanly:

```bash
docker compose logs -f
```

You should see:
- PostgreSQL reporting it's ready to accept connections
- Prisma migrations running successfully
- Next.js reporting `Ready on http://0.0.0.0:3000`

Press `Ctrl+C` to stop watching logs.

### 10.3 Verify the Containers Are Running

```bash
docker compose ps
```

Both `gymjournal-postgres` and `gymjournal-app` should show status `Up` (healthy).

---

## Step 11 — Create Your Account and Verify Access

### 11.1 Open Gym Journal

Navigate to your app URL in a browser:

| Path | URL |
|------|-----|
| **Non-Starlink** | `https://mygymjournal.duckdns.org` |
| **Starlink (Tailscale)** | `http://YOUR_TAILSCALE_IP:3000` (e.g. `http://100.101.102.103:3000`) |

> **Note (non-Starlink):** If the certificate isn't ready yet (1–2 minutes after first access), try again. You can also test locally first at `http://192.168.1.105:3000` (dedicated server) or `http://localhost:3000` (same computer).

### 11.2 Create Your Account

1. Click **Sign Up** (or **Register**) on the login page
2. Enter your email, a display name, and a strong password
   - Use a password manager (Bitwarden is free) or a long, random passphrase
   - This is your personal fitness data — protect it with a real password
3. Log in with those credentials

### 11.3 Verify Access from Outside

**Non-Starlink:** On your phone, **switch to mobile data** (not home WiFi), then open `https://mygymjournal.duckdns.org`. If you see the Gym Journal login page, everything is working end-to-end.

**Starlink (Tailscale):** On your phone, ensure the Tailscale app is connected and logged in with the same account as the server. Then open `http://YOUR_TAILSCALE_IP:3000` in a browser — you should reach the login page.

### 11.4 Confirm Database Persistence

Log a workout, then restart the containers to confirm your data persists:

```bash
cd ~/gym-journal
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Log in again and confirm your workout is still there. Data lives in the `postgres_data` Docker volume, which survives container restarts and updates.

---

## Step 12 — Install the App on Your Phone and Computers

Gym Journal is a **Progressive Web App (PWA)** — you can install it to your device's home screen so it opens like a native app (full screen, app icon, no browser chrome).

> **Starlink note:** PWA installation works on HTTP over Tailscale on Android and desktop. iOS (Safari) requires HTTPS to install PWAs — Tailscale users on iPhone may need to access the app via Safari without the install prompt, or set up a self-signed cert (advanced, not covered here).

### Android (Chrome)

1. Open Chrome and navigate to your Gym Journal URL
2. Log in
3. Tap the three-dot menu → **Add to Home Screen** (or look for the install banner at the bottom)
4. Tap **Install**

The app now appears on your home screen and opens full-screen.

### iPhone / iPad (Safari)

**Non-Starlink only** (requires HTTPS):

1. Open **Safari** and navigate to `https://mygymjournal.duckdns.org`
2. Log in
3. Tap the **Share** button (box with arrow pointing up)
4. Scroll down and tap **Add to Home Screen**
5. Tap **Add**

The app now appears on your home screen.

### Desktop (any browser)

**Non-Starlink:**

- In Chrome or Edge, visit your DuckDNS URL and look for the install icon (monitor with down arrow) in the address bar. Click it → **Install**.
- In Firefox, PWA install support is limited — use the browser tab directly.

**Starlink:** In Chrome or Edge, visit `http://YOUR_TAILSCALE_IP:3000` and use the install icon in the address bar if it appears. Otherwise, just use the browser tab and bookmark it.

### On Your Home Network (Local Access)

**Non-Starlink:** When you're home, the app connects via your DuckDNS domain. Some routers support "hairpin NAT" and it just works. If the domain doesn't resolve locally, add this to other devices' `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
192.168.1.105    mygymjournal.duckdns.org
```

Replace `192.168.1.105` with your server's actual static IP.

**Starlink:** When home, use the same Tailscale URL (`http://YOUR_TAILSCALE_IP:3000`); traffic stays on Tailscale. You can also use the server's local IP directly: `http://192.168.1.105:3000` if you're on the same WiFi.

---

## Step 13 — Keep Everything Updated

### Ubuntu Packages (Automatic)

Already set up in Step 1.4 via `unattended-upgrades`.

### Gym Journal App

When a new version of the app is released:

```bash
cd ~/gym-journal

# Pull the latest code
git pull origin main

# Rebuild and restart (Prisma migrations run automatically on startup)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Clean up old images
docker image prune -f
```

Your database data is preserved in the `postgres_data` Docker volume — it is not affected by rebuilds.

### Automate Monthly Updates (Optional)

```bash
crontab -e
```

Add (replace `/home/gymserver` with your actual home directory):

```
0 3 1 * * cd /home/gymserver/gym-journal && git pull origin main && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build && docker image prune -f >> /home/gymserver/gym-journal/update.log 2>&1
```

This pulls and rebuilds at 3am on the 1st of every month.

### Caddy *(non-Starlink only)*

```bash
sudo apt update && sudo apt upgrade caddy -y
```

### Check Fail2ban is Working

```bash
sudo fail2ban-client status sshd
sudo fail2ban-client status caddy    # Non-Starlink only
```

Shows how many IPs have been banned and how many failed attempts were caught.

### Back Up Your Database (Highly Recommended)

Your workout data lives in the PostgreSQL container. Back it up regularly:

```bash
# Create a backup (run this manually or add to a cron job)
docker exec gymjournal-postgres pg_dump -U gymjournal gymjournal > ~/gym-journal-backup-$(date +%Y%m%d).sql
```

To restore from a backup:

```bash
docker exec -i gymjournal-postgres psql -U gymjournal gymjournal < ~/gym-journal-backup-20240101.sql
```

Store backup files somewhere safe (external drive, cloud storage, another machine).

---

## Troubleshooting

### "I can't reach the app from outside"

**Non-Starlink:**

1. Check port forwarding is saved on your router
2. Check UFW allows ports 80 and 443: `sudo ufw status`
3. Check Caddy is running: `sudo systemctl status caddy`
4. Check Caddy logs for errors: `sudo journalctl -u caddy --since "10 minutes ago"`
5. Verify your DuckDNS domain points to your current public IP: compare `curl https://ifconfig.me` on the server with the IP on duckdns.org

**Starlink (Tailscale):** Ensure the *client* device is logged into Tailscale with the same account as the server. Check Tailscale status on the server: `sudo tailscale status`. Use the server's Tailscale IP, not the local IP, from outside your home network.

### "Login fails / redirect loop / callback URL mismatch"

This almost always means `NEXTAUTH_URL` in `.env` doesn't match the URL you're using to access the app.

1. Check what URL you're using in your browser (exact URL including `https://` or `http://`)
2. Check your `.env`: `cat ~/gym-journal/.env | grep NEXTAUTH_URL`
3. They must match exactly — same protocol, same domain/IP, same port (if non-standard)
4. After fixing `.env`, rebuild: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`

### "Caddy certificate error / HTTPS not working" *(non-Starlink only)*

- Ensure ports 80 and 443 are forwarded and reachable from the internet
- Check DuckDNS domain is resolving: `nslookup mygymjournal.duckdns.org`
- Check Caddy logs: `sudo journalctl -u caddy -n 50`
- Let's Encrypt rate-limits certificate requests — if you've requested many certificates for the same domain in a short period, wait an hour and try again

### "The app starts but shows a database connection error"

1. Check both containers are running: `docker compose ps`
2. If `gymjournal-postgres` is not healthy, check its logs: `docker compose logs postgres`
3. Check the `POSTGRES_PASSWORD` in `.env` matches what's in the Docker Compose environment — if you ever change the password, you also need to reset the volume:
   ```bash
   docker compose down
   docker volume rm gym-journal_postgres_data
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
   **Warning:** This deletes all data. Only do this if the database has no data you care about or you have a backup.

### "Migrations failed on startup"

Check the app container logs:

```bash
docker compose logs app
```

If you see a Prisma migration error, it usually means the database container wasn't healthy yet when the app started (a race condition). Restart the app container:

```bash
docker compose restart app
```

The restart gives PostgreSQL time to finish initializing, and Prisma will try migrations again.

### "Permission denied (publickey)" when SSHing to gymserver

**1. Verify `AllowUsers` is set correctly:**

```bash
sudo grep AllowUsers /etc/ssh/sshd_config
# Should show: AllowUsers gymserver
```

If it says anything else, fix it, then `sudo systemctl restart sshd`.

**2. Verify `authorized_keys` contains the public key, not the private key:**

```bash
# Public key looks like: ssh-ed25519 AAAA...
# Private key looks like: -----BEGIN OPENSSH PRIVATE KEY-----
sudo cat /home/gymserver/.ssh/authorized_keys
```

If it shows `-----BEGIN OPENSSH PRIVATE KEY-----`, the wrong file was copied. Fix it:

```bash
sudo bash -c "cat $HOME/.ssh/id_ed25519.pub > /home/gymserver/.ssh/authorized_keys"
```

**3. Verify file permissions:**

```bash
sudo chown -R gymserver:gymserver /home/gymserver/.ssh
sudo chmod 700 /home/gymserver/.ssh
sudo chmod 600 /home/gymserver/.ssh/authorized_keys
```

### "I locked myself out of SSH"

You'll need to log in directly at the machine (keyboard + screen). If it's a dedicated server, that means physical access to the server box; if it's the same computer, open a local terminal. Then check `sudo ufw status` and `sudo systemctl status sshd`.

### "Docker container won't start / out of disk space"

```bash
# Check disk usage
df -h

# Check container logs
docker compose logs app
docker compose logs postgres

# Clean up unused Docker images, containers, and volumes (careful: don't remove postgres_data)
docker system prune -f
```

### "Fail2ban banned my own IP"

```bash
sudo fail2ban-client unban YOUR_IP_ADDRESS
```

And add your IP/network to `ignoreip` in `/etc/fail2ban/jail.local`:

```ini
ignoreip = 127.0.0.1/8 192.168.1.0/24 YOUR_IP
```

Then restart Fail2ban: `sudo systemctl restart fail2ban`.

---

## Security Checklist

Before considering your setup "done", verify the following. Items marked *(non-Starlink)* or *(Starlink)* apply only to that path.

**Everyone:**

- [ ] Ubuntu is fully updated (`apt update && apt upgrade`)
- [ ] Automatic security updates are enabled (`unattended-upgrades`)
- [ ] SSH password authentication is **disabled**
- [ ] SSH root login is **disabled**
- [ ] UFW firewall is enabled
- [ ] Fail2ban is running and monitoring SSH (and Caddy for non-Starlink)
- [ ] `NEXTAUTH_SECRET` is a randomly generated value of at least 32 characters
- [ ] `POSTGRES_PASSWORD` is a strong, randomly generated password (not `changeme`)
- [ ] `.env` file is not committed to git (verify: `git status` should not show `.env`)
- [ ] Your Gym Journal account uses a strong, unique password
- [ ] You can access Gym Journal from your phone (mobile data for non-Starlink; Tailscale for Starlink)
- [ ] Docker Compose is configured to auto-restart (`restart: unless-stopped`)
- [ ] You have tested that data persists after a `docker compose down && up`
- [ ] You have a database backup strategy (manual `pg_dump` or cron job)

**Non-Starlink only:**

- [ ] Caddy is serving HTTPS with a valid Let's Encrypt certificate (padlock in browser)
- [ ] `NEXTAUTH_URL` is set to `https://yourdomain.duckdns.org` (with `https://`)
- [ ] Your router admin password is changed from the default
- [ ] DuckDNS auto-update is running (check `~/duckdns/duck.log` shows `OK`)
- [ ] App container binds to `127.0.0.1:3000` only (Caddy proxies from outside)

**Starlink only:**

- [ ] Tailscale is installed on the server and on each device you use for Gym Journal
- [ ] You can reach Gym Journal at `http://YOUR_TAILSCALE_IP:3000` from a device on Tailscale
- [ ] `NEXTAUTH_URL` is set to `http://YOUR_TAILSCALE_IP:3000`

---

## Summary of What's Running on Your Server

| Service              | How It Runs                | Purpose                                          | Path              |
|----------------------|----------------------------|--------------------------------------------------|-------------------|
| Ubuntu               | OS                         | The operating system                             | Everyone          |
| UFW                  | System service             | Firewall — blocks unauthorized traffic           | Everyone          |
| Fail2ban             | System service             | Bans IPs after failed login attempts             | Everyone          |
| Docker               | System service             | Container runtime                                | Everyone          |
| PostgreSQL           | Docker container           | Database — stores all your workout data          | Everyone          |
| Gym Journal (Next.js)| Docker container           | The web app                                      | Everyone          |
| Caddy                | System service             | HTTPS termination + reverse proxy on port 443    | Non-Starlink only |
| DuckDNS              | Cron job (every 5 min)     | Keeps domain pointing to your home IP            | Non-Starlink only |
| Tailscale            | System service             | Private mesh — access app without port forwarding| Starlink only     |
| unattended-upgrades  | System service             | Installs security updates automatically          | Everyone          |

---

*This guide is designed for personal use on a home network. Your workout data is private and stored entirely on your own hardware — nothing is sent to any third-party service.*
