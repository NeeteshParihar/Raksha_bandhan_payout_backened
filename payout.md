# Implement Payout Mechanism (Manual Fulfillment)

This plan outlines the architecture and steps required to build the payout mechanism for sisters using a manual fulfillment approach. This avoids payment gateway KYC restrictions while still tracking all debts and payouts securely. 

## Proposed Changes

### 1. Services

#### [NEW] `src/services/payout.ts`
Create a dedicated service layer to handle the payout logic:
- `requestPayoutOtpService`: 
    - Verifies that the quiz belongs to the sister and is in the `COMPLETED` state.
    - Checks if a `PENDING` or `SUCCESS` payout already exists for this quiz to prevent double requests.
    - Generates a 6-character alphanumeric OTP.
    - Stores the OTP in Redis using a key like `PAYOUT_OTP_${sisterId}_${quizId}` with a 5-minute expiry.
    - Sends the OTP via SMS using Twilio to the sister.
- `verifyAndRequestPayoutService`:
    - Validates the OTP from Redis.
    - **Amount Calculation**: Queries the `Attempt` model to sum up `amountEarned` for all records associated with `quizId`.
    - If a `couponCode` is provided, fetches the coupon, verifies it is `UNUSED` and belongs to this brother-sister pair, and adds its amount to `couponAmount`.
    - Creates a new `Payout` record in the database with `status: PENDING`.
    - **Notification**: Triggers an SMS to the **Brother** indicating: *"Your sister has requested her Rakhi reward of ₹[totalAmount]. Please transfer the amount to her UPI ID: [upiId] and mark it as paid in the app."*
    - Deletes the OTP from Redis to prevent reuse.
- `markPayoutAsPaidService`:
    - Finds the payout by ID and verifies the `brotherId` matches the requester.
    - Updates the payout status from `PENDING` to `SUCCESS`.

### 2. Controllers

#### [MODIFY] `src/controllers/payout.ts`
Implement the controllers for the endpoints:
- `requestPayoutOtp`: Extracts `quizId` from the payload, validates the user is a `SISTER`, and calls `requestPayoutOtpService`.
- `verifyAndRequestPayout`: Extracts `quizId`, `otp`, `upiId`, and an optional `couponCode` from the payload. Validates the user is a `SISTER`, and calls `verifyAndRequestPayoutService`.
- `markPayoutPaid`: Extracts `payoutId` from the payload, validates the user is a `BROTHER`, and calls `markPayoutAsPaidService`.

### 3. Routes

#### [MODIFY] `src/routes/payout.ts`
Wire up the endpoints and apply authentication middlewares:
- Protect `/request-otp` and `/verify-and-request` using `validateUser` and `validateUserRole(UserRole.SISTER)`.
- Create a new endpoint `PATCH /:payoutId/mark-paid` and protect it using `validateUser` and `validateUserRole(UserRole.BROTHER)`.

## Open Questions

> [!IMPORTANT]
> 1. Do you want to add an endpoint for the Brother to view all his `PENDING` payouts so he has a dashboard of who he owes money to?
> 2. The `Payout` model currently doesn't store the `brotherId` directly (it stores `quizId`). We can easily fetch the brother through the `Quiz`, but adding `brotherId` to the `Payout` model might make querying faster. Shall I update the `Payout` model to include `brotherId`?
