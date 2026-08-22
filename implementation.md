# Raksha Bandhan Quiz Payout App

This plan synthesizes the requirements from both `Chat.md` and `project_plan.md` to establish the architecture and workflow for the Raksha Bandhan payout app.

## Goal Description
Build a web application where brothers can create quizzes for their sisters. The sister receives a secure URL via SMS, plays a stateful quiz, and earns money based on correct answers. Brothers can also generate bonus **coupons** to add extra money. Before the final payout is processed to her UPI ID, an OTP verification is performed to ensure security. 

## Technical Stack
- **Frontend**: React (Vite) with Tailwind CSS for modern, dynamic UI.
- **Backend**: Node.js with Express.
- **Database**: MongoDB (using Mongoose).
- **Payment Gateway**: Payout APIs will be mocked/stubbed for now since no live account is available, allowing for easy drop-in of RazorpayX/Cashfree later.

## User Review Required
> [!IMPORTANT]
> - **OTP Provider**: Since we need OTP at the end for payout verification, we will need an SMS service (e.g., Twilio, Fast2SMS) or we can mock the OTP in the console during development. I will mock it for now.
> - **App Structure**: I will create two separate folders in the root: `client` (React) and `server` (Node.js).
> Please review the finalized flow below and click **Proceed** to start development!

## Proposed Architecture & Workflow

### 1. Database Schema (MongoDB / Mongoose) 
- **User:** `name`, `phoneNumber`, `role` (BROTHER | SISTER)
- **Quiz:** `brotherId`, `sisterId`, `status` (PENDING | IN_PROGRESS | COMPLETED) 
- **QuizQuestion:** `quizId`, `questionDesc`, `type` (MCQ | INPUT), `options` (Array), `correctAnswer`, `scoreAmount`
- **Attempt (Stateful):** `quizId`, `questionId`, `isCorrect` - *Ensures state is maintained on refresh.*
- **Coupon:** `code`, `brotherId`, `sisterId`, `bonusAmount`, `status` (UNUSED | APPLIED)
- **Payout:** `quizId`, `sisterId`, `upiId`, `totalAmount` (Quiz + Coupon), `status` (PENDING | SUCCESS | FAILED)

### 2. Core API Routes (Server)
- **Brother Flow:**
  - `POST /api/brothers/register`
  - `POST /api/sisters` (Add sister)
  - `POST /api/quizzes` (Create quiz & questions)
  - `POST /api/coupons` (Create a bonus coupon)
  - `GET /api/invite/generate` (Generate the secure encrypted link)
- **Sister Flow:**
  - `GET /api/auth/validate-link` (Decrypt link & login sister)
  - `GET /api/quizzes/:id/state` (Fetch questions & current progress)
  - `POST /api/quizzes/:id/answer` (Submit answer, validate, and save attempt)
  - `POST /api/coupons/apply` (Apply coupon for bonus money)
- **Payout & Security Flow:**
  - `POST /api/payout/request-otp` (Send OTP to sister's phone)
  - `POST /api/payout/verify-and-pay` (Verify OTP, accept UPI ID, and trigger mock Payout)

### 3. Frontend Implementation (Client)
- **Brother Dashboard:** Interface to add sister details, create custom questions, create bonus coupons, and generate the invite link.
- **Sister Experience:** 
  - Welcome screen when opening the secure link.
  - Stateful Quiz UI with dynamic, realtime reactions (emojis/cute faces) based on answers.
  - Coupon entry screen to claim bonus money.
  - Results screen showing the accumulated total money (Quiz + Coupon).
  - OTP Verification Screen.
  - UPI ID input screen.
  - Success screen with Confetti animations.

## Verification Plan
1. **Setup**: Initialize `client` (React) and `server` (Node/Express).
2. **Backend Validation**: Test the secure URL encryption/decryption and score accumulation via API tests.
3. **Frontend Integration**: Walk through the Brother flow to generate a link, then simulate the Sister flow (answering questions, applying a coupon, and completing the mock OTP/Payout process).
