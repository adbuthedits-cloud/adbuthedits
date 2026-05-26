# AWS SES & Firebase Phone Auth Production Setup Guide

This guide details the pricing, offerings, prerequisites, and step-by-step instructions to set up **Amazon SES (Simple Email Service)** and **Firebase Phone Authentication** for a production-ready environment on `adbuthverse.com`.

---

## Part 1: Amazon SES (Simple Email Service)

Amazon SES is a high-performance, cost-effective transactional email service designed to send large volumes of automated emails (like OTPs) with high deliverability.

### 1. What AWS SES Offers
* **High Deliverability:** Authenticates your emails using SPF, DKIM, and DMARC protocols, ensuring OTP emails land in the primary inbox, not the spam folder.
* **Low Cost:** Extremely cheap. It costs **$0.10 (approx. ₹8.30 INR) per 1,000 emails sent**.
* **High Limits:** Scales automatically to handle thousands of concurrent requests.

### 2. What You Must Provide
* **AWS Account:** Active Amazon Web Services account.
* **Custom Domain:** Access to your domain registrar's DNS settings (e.g. Hostinger, Cloudflare, or GoDaddy for `adbuthverse.com`) to add verification records.
* **Use Case Description:** A brief explanation for AWS support to move your account out of the SES sandbox (e.g., *"We are sending transactional 6-digit OTP verification emails for user sign-in on our website adbuthverse.com"*).

### 3. Step-by-Step Production Setup Process

#### Step 1: Create and Verify Your Domain Identity
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Search for and open **Amazon SES**.
3. In the left navigation menu, click **Verified Identities** under *Configuration*.
4. Click **Create Identity**.
5. Select **Domain** as the identity type.
6. Enter your domain name: `adbuthverse.com`.
7. Under **DKIM (DomainKeys Identified Mail)** settings:
   * Keep **Easy DKIM** selected.
   * Set **DKIM key length** to `2048-bit`.
8. Click **Create Identity**.

#### Step 2: Update Your DNS Records (Cloudflare/Hostinger)
1. After creating the domain identity, Amazon SES will generate a list of **CNAME** records for DKIM verification.
2. Log in to your DNS provider (e.g. Cloudflare where `adbuthverse.com` is managed).
3. Copy the **3 CNAME records** from the AWS console and add them to your DNS records.
4. Once added, wait 5–30 minutes. Amazon SES will show the domain status as **"Verified"** (a green checkmark).

#### Step 3: Request Sandbox Removal (Move to Production)
By default, all new AWS SES accounts are placed in the "Sandbox" environment. In the sandbox, you can only send emails to addresses you have manually verified. To send OTPs to anyone, you must request production access:
1. On the Amazon SES console dashboard, click the alert banner that says **"Request production access"** (or go to Account Dashboard > Request Production Access).
2. Fill out the request form:
   * **Mail Type:** Transactional (OTPs).
   * **Website URL:** `https://www.adbuthverse.com`
   * **Detailed Description:** Paste a template description like this:
     > *"We are requesting production access to send transactional 6-digit OTP verification codes for user sign-up, login, and password resets on our web application (https://www.adbuthverse.com). Emails are sent instantly upon user request. We enforce strict rate-limiting (max 5 requests per hour per user) and cooldowns to prevent spam."*
3. Submit the request. AWS support typically reviews and approves these requests within 12 to 24 hours.

#### Step 4: Generate SMTP Credentials for your Backend
1. On the Amazon SES console, click **SMTP Settings** in the left menu.
2. Click **Create SMTP Credentials**.
3. Give the IAM user a name (e.g., `adbuth-ses-smtp-user`) and click **Create**.
4. Copy the **SMTP Username** and **SMTP Password** generated on the screen.
5. Add these credentials to your backend `.env` file:
   ```env
   EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com # (Or your AWS region host)
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=your_aws_smtp_username
   EMAIL_PASS=your_aws_smtp_password
   ```

---

## Part 2: Firebase Phone Authentication

Firebase Phone Authentication allows users to sign in using their phone numbers by sending an SMS containing a 6-digit OTP.

### 1. What Firebase Phone Auth Offers
* **Zero DLT Paperwork:** Bypasses TRAI DLT registration regulations in India. Google manages all templates and routes.
* **Bot Protection:** Integrates reCAPTCHA automatically to prevent SMS spam bots from draining your billing credits.
* **Simple SDKs:** Highly stable Javascript SDK for the frontend and Firebase Admin SDK for backend verification.

### 2. What You Must Provide
* **Google Account:** To create and manage the Firebase project.
* **Credit Card / Billing Account:** Needed to upgrade the project to the Blaze (Pay-as-you-go) Plan to send real SMS.
* **Authorized Domain List:** Configuring your production domains to allow reCAPTCHA verification.

### 3. Step-by-Step Production Setup Process

#### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g. `adbuthverse-auth`).
3. Click **Continue** (Enable or disable Google Analytics depending on preference) and click **Create Project**.

#### Step 2: Enable Phone Authentication
1. In the left sidebar of your Firebase project dashboard, click **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, select **Phone** from the list of native providers.
4. Click the toggle to **Enable** it.
5. (Optional) For testing, expand the *Phone numbers for testing* section and add a test phone number (e.g., `+91 99999 99999`) and a verification code (e.g., `123456`). This allows you to test the flow for free.
6. Click **Save**.

#### Step 3: Add Authorized Domains
To prevent spam, Firebase forces reCAPTCHA checks. The reCAPTCHA will fail if your website domain is not listed in the authorized domains list:
1. In the **Authentication** section, click the **Settings** tab.
2. Click **Authorized domains** in the submenu.
3. Click **Add domain**.
4. Add your production domain: `adbuthverse.com`. Also add `adbuth-backend.onrender.com` (your backend domain) and `localhost` (for development).

#### Step 4: Upgrade to the Blaze Plan
To send real SMS OTPs in production, you must upgrade your project billing plan:
1. In the bottom-left corner of the Firebase console, click the **Upgrade** button next to *Spark Plan*.
2. Select the **Blaze (Pay-as-you-go) Plan**.
3. Link your credit card or Google Cloud Billing account.
4. *Note: SMS rates for India will be approximately $0.01 (~₹0.84 INR) per OTP.*

#### Step 5: Get Firebase Config keys for Frontend and Backend

##### A. Frontend Next.js Credentials:
1. Go to **Project Settings** (the gear icon next to Project Overview in the left menu).
2. Under the *General* tab, scroll down to *Your apps* and click the **Web icon `</>`** to register a web app.
3. Name it (e.g., `adbuth-web`) and click **Register app**.
4. Copy the generated `firebaseConfig` JSON. It will look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "adbuthverse-auth.firebaseapp.com",
     projectId: "adbuthverse-auth",
     storageBucket: "adbuthverse-auth.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234..."
   };
   ```
5. Place these variables in your frontend `.env.local` file.

##### B. Backend Node.js Admin Credentials:
1. In **Project Settings**, go to the **Service accounts** tab.
2. Select **Node.js** and click **Generate new private key**.
3. Click **Generate key** to download the secure `.json` file containing your service account credentials.
4. Save this file securely on your backend server (e.g., as `config/firebase-service-account.json`) and **never** commit it to public Git repositories.
5. In your backend `.env` file, specify the path to this file:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```
