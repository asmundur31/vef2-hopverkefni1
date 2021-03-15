import express from 'express';

export const router = express.Router();

// skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
// router.get('/users/', catchErrors(allAvailable));

// skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi
// router.get('/users/{userId}', catchErrors(allAvailable));

// breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi og er ekki að breyta sér sjálfum
// router.patch('/users/{userId}', catchErrors(allAvailable));

// staðfestir og býr til notanda. Skilar auðkenni og netfangi. Notandi sem búinn er til skal aldrei vera stjórnandi
// router.post('/users/register', catchErrors(allAvailable));

// með netfangi og lykilorði skilar token ef gögn rétt
// router.post('/users/login', catchErrors(allAvailable));

// skilar upplýsingum um notanda sem á token, auðkenni og netfangi, aðeins ef notandi innskráður
// router.get('/users/me', catchErrors(allAvailable));

// uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður
// router.patch('/users/me', catchErrors(allAvailable));

// Aldrei skal skila eða sýna hash fyrir lykilorð.
