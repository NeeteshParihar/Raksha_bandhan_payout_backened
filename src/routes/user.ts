import { Router } from 'express';
// controlers
import { registerBrother, registerSister, loginBrother, getOtp, loginByOtp, getProfile, getSistersAccounts, deleteSisterAccount, registerUser, loginUser, logoutUser} from '../controllers/user.js';

// midleware
import { validateUser } from '../middlewares/validateUser.js';

const router = Router();

// Brother Registration
router.post('/register-brother', registerBrother);

// Add Sister (Brother action)
router.post('/register-sister', validateUser,  registerSister);

// login brother
router.post("/login-brother", loginBrother);

// Get User Profile
router.get("/profile", validateUser, getProfile);

// Get Sisters Accounts (Brother action)
router.get("/sisters", validateUser, getSistersAccounts);

// Delete Sister Account (Brother action)
router.delete("/sister/:sisterId", validateUser, deleteSisterAccount);

// getOtp
router.post("/get-otp", getOtp );
router.post("/login-by-otp",loginByOtp );


// Generate encrypted invite link (Brother action)
router.get('/generate-invite/:sisterId', (req, res) => {
  res.send('Generate Invite Link API');
});

// Validate encrypted invite link (Sister action) 
router.post('/validate-invite', (req, res) => {
  res.send('Validate Invite Link API');
});

// Unified User Routes
router.post('/register-user', registerUser);
router.post('/login-user', loginUser);
router.post('/logout', validateUser, logoutUser);

export default router;
