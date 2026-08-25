import { Router } from 'express';
// controlers
import { registerBrother, registerSister, loginBrother, getOtp, loginSister, getProfile} from '../controllers/user.js';

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

// getOtp for sister
router.get("/get-otp/:sisterId", getOtp );
router.post("/login-sister",loginSister );


// Generate encrypted invite link (Brother action)
router.get('/generate-invite/:sisterId', (req, res) => {
  res.send('Generate Invite Link API');
});

// Validate encrypted invite link (Sister action) 
router.post('/validate-invite', (req, res) => {
  res.send('Validate Invite Link API');
});

export default router;

