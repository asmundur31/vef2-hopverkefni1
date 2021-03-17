import express from 'express';

export const router = express.Router();

function allUsers(req, res) {
  const users = {
    allUsers: `Hér eiga að koma allir users`,
  };
  return res.json(users);
}

function registerUser(req, res) {
  const user = {
    newUser: `Búum til nýjan user`,
  };
  return res.json(user);
}

function loginUser(req, res) {
  const user = {
    loginUser: `Skráum inn user`,
  };
  return res.json(user);
}

function loggedInUser(req, res) {
  const user = {
    user: `Upplýsingar um innskráðan notanda`,
  };
  return res.json(user);
}

function updateLoggedInUser(req, res) {
  const user = {
    user: `Uppfærum innskráðan notanda`,
  };
  return res.json(user);
}

function oneUser(req, res) {
  const { userId } = req.params;
  const user = {
    oneUsers: `Hér kemur user með userId = ${userId}`,
  };
  return res.json(user);
}

function updateUser(req, res) {
  const { userId } = req.params;
  const user = {
    update: `Uppfærum user með userId = ${userId}`,
  };
  return res.json(user);
}

// skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
router.get('/', allUsers);
/*
staðfestir og býr til notanda. Skilar auðkenni og netfangi. Notandi sem búinn er til skal
aldrei vera stjórnandi
*/
router.post('/register', registerUser);
// með netfangi og lykilorði skilar token ef gögn rétt
router.post('/login', loginUser);
// skilar upplýsingum um notanda sem á token, auðkenni og netfangi, aðeins ef notandi innskráður
router.get('/me', loggedInUser);
// uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður
router.patch('/me', updateLoggedInUser);
// skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi
router.get('/:userId', oneUser);
/*
breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi
og er ekki að breyta sér sjálfum
*/
router.patch('/:userId', updateUser);

// Aldrei skal skila eða sýna hash fyrir lykilorð.
