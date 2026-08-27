# Raksha Bandhan Payout - Database Models Documentation

This document explains the MongoDB database architecture for the Raksha Bandhan Payout application, including the reasoning behind key design decisions.

## 1. User Model (`User`)
**Purpose**: Stores the identity and authentication details for both Brothers and Sisters.
- **Fields**: `phoneNumber`, `name`, `password`, `role`.
- **Design Reasoning**:
  - `phoneNumber` is indexed and unique, acting as the primary identifier.
  - `password` uses a dynamic `required` validator. Brothers need a password to log into the dashboard, but Sisters authenticate via a secure SMS link, so their password field is optional.
  - `role` uses an Enum (`BROTHER`, `SISTER`) to enforce strict typing and authorization checks.

## 2. Quiz Model (`Quiz`) & Nested Question Schema
**Purpose**: Represents a quiz created by a Brother specifically for a Sister.
- **Fields**: `brotherId`, `sisterId`, `status`, `questions` (Array of subdocuments).
- **Question Subdocument Fields**: `quesDesc`, `questionType` (MCQ/TEXT), `optionType`, `optionsList`, `answerList`, `scoreAmount`, `level`.
- **Design Reasoning**:
  - **Nesting Questions**: Questions are nested inside the `Quiz` document rather than being their own collection. Since a quiz has a limited number of questions (e.g., 5-20), this avoids expensive MongoDB `$lookup` joins and allows fetching the entire quiz state in a single query.
  - **Array of Answers**: `answerList` is an array to support multiple correct choices for MCQs, or multiple valid text variations (e.g., "Delhi", "New Delhi") for TEXT inputs.
  - **Single Sister per Quiz**: The `sisterId` explicitly ties this specific quiz instance to one sister. If a brother has multiple sisters, he duplicates/assigns a new Quiz document for each.

## 3. Attempt Model (`Attempt`)
**Purpose**: Tracks a Sister's answers to the questions in a stateful, immutable way.
- **Fields**: `quizId`, `questionId`, `isCorrect`, `amountEarned`.
- **Design Reasoning**:
  - **Immutability & Single Source of Truth**: By keeping the attempt records separate from the Quiz and recording the `amountEarned` at the time of answering, we freeze the reward in history. If a brother later alters the question's `scoreAmount` in the Quiz, the sister's already-earned money won't retroactively (and buggily) change.
  - **Unique Compound Index**: `{ quizId: 1, questionId: 1 }` is indexed as `unique: true`. This mathematically guarantees at the database level that a sister can only ever attempt a question once, preventing double-rewards from race conditions (like refreshing the page rapidly).

## 4. Coupon Model (`Coupon`)
**Purpose**: Allows Brothers to generate bonus money codes for their Sisters.
- **Fields**: `couponCode`, `amount`, `status`, `expiry`, `brotherId`, `sisterId`.
- **Design Reasoning**:
  - `sisterId` ensures that a coupon is explicitly assigned to a specific sister, preventing one sister from accidentally guessing and using another sister's code.

## 5. Payout Model (`Payout`)
**Purpose**: Logs the final transaction details when a Sister cashes out her earnings.
- **Fields**: `sisterId`, `quizId`, `upiId`, `totalAmount`, `couponAmount`, `quizAmount`, `status`.
- **Design Reasoning**:
  - Stores the exact breakdown of the payout (Quiz vs. Coupon) for auditing purposes.
  - `status` (`PENDING`, `SUCCESS`, `FAILED`) allows the system to handle asynchronous webhook updates from the payment gateway (like RazorpayX).

---

## 🔍 Model Audit & Potential Improvements
Upon reviewing the models, the architecture is extremely solid. Here are two minor edge cases / optimizations to consider:

1. **Attempt Model Query Optimization**: Currently, `Attempt` only references `quizId`. If we ever need to query "All money earned by Sister X across all her quizzes", we'd have to join with the `Quiz` collection to filter by her ID. Adding `sisterId` directly to the `Attempt` model could slightly optimize analytical queries, though it's not strictly necessary right now since payouts are processed per-quiz.
2. **Coupon Applied Tracking**: When a coupon's status changes to `APPLIED`, we currently don't track *which* payout it was applied to. We might want to add a `payoutId` (optional) to the Coupon model for better auditing, just in case there's ever a dispute about where the bonus money went.

---

## 🚀 Frontend API Documentation

This section provides a summary of all available API routes for the frontend application. (Assume the base path like `/api/v1` is prefixed before these routes based on your main Express setup).

### 1. User & Auth APIs (`/user`)
- **`POST /register-brother`** - Register a new Brother account.
- **`POST /register-sister`** - Register a Sister (Requires Brother auth).
- **`POST /login-brother`** - Login for Brother.
- **`GET /profile`** - Get User Profile (Requires Auth).
- **`GET /sisters`** - Get all Sisters Accounts for the logged-in Brother (Brother action).
- **`GET /brothers`** - Get all Brothers Accounts for the logged-in Sister (Sister action).
- **`DELETE /sister/:sisterId`** - Delete Sister Account (Brother action).
- **`POST /get-otp`** - Generate OTP for Sister login.
- **`POST /login-by-otp`** - Login for Sister using OTP.
- **`GET /generate-invite/:sisterId`** - Generate encrypted invite link (Brother action).
- **`POST /validate-invite`** - Validate encrypted invite link (Sister action).
- **`POST /register-user`** - Unified user registration.
- **`POST /login-user`** - Unified user login.
- **`POST /logout`** - Unified user logout.
- **`PATCH /update-password`** - Update user password.

### 2. Quiz APIs (`/quiz`)
- **`POST /`** - Create a new quiz (Brother action).
- **`GET /sister/:userId`** - Fetch all quizzes for a specific sister (Brother action).
- **`GET /:quizId`** - Fetch a single quiz state including questions (Brother/Sister action).
- **`POST /:quizId/question`** - Add a question to a quiz (Brother action, supports file upload).
- **`DELETE /:quizId/question/:questionId`** - Delete a question from a quiz (Brother action).
- **`PATCH /:quizId`** - Update quiz status (Brother/Sister action).
- **`DELETE /quiz/:quizId`** - Delete a quiz (Brother action).

### 3. Attempt APIs (`/attempt`)
- **`POST /:quizId/:questionId`** - Submit an answer for a specific question (Sister action).
- **`GET /:quizId`** - Fetch all attempts for a specific quiz (Brother/Sister action).

### 4. Coupon APIs (`/coupon`)
- **`POST /`** - Create a bonus coupon (Brother action).
- **`GET /`** - Get all coupons created by the brother.
- **`GET /sister/:sisterId`** - Get all coupons for a specific sister (Brother action).
- **`DELETE /:couponId`** - Delete a coupon.
- **`PATCH /:couponId`** - Edit a coupon.
- **`POST /apply`** - Apply a bonus coupon (Sister action).

### 5. Payout APIs (`/payout`)
- **`GET /pay`** - Endpoint for redirecting HTTP to UPI scheme.
- **`POST /:quizId`** - Create a payout request (Sister action).
- **`GET /success/:quizId`** - Get a successful payout by quizId.
- **`PATCH /:payoutId/status`** - Update the status of a payout.
- **`GET /brother/all`** - Get all payouts for a brother.
