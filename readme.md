# Vefforritun 2, 2021, hópverkefni 1

Hópmeðlimir: 
* Auður Katarína Theodórsdóttir - audurkatarina
* Ásmundur Óskar Ásmundsson - asmundur31

## Upplýsingar um hvernig setja skuli upp verkefnið
### Setja verkefnið upp á eigin tölvu
Framkvæma á eftirfarandi skref til að keyra verkefnið á eigin tölvu:
1. Clone'a eftirfarandi repository
2. Setja upp PostgreSQL gagnagrunn
3. Búa til aðgang á Cloudinary
4. Búa til .env skrá og skilgreina eftirfarandi breytur í henni:
    1. DATABASE_URL = postgres://:@localhost/...
    2. CLOUD_NAME = ...
    3. CLOUD_KEY = ...
    4. CLOUD_SECRET = ...
    5. JWT_SECRET = ...
5. Keyra `npm install` til að ná í viðeigandi dependency
6. Keyra `npm run setup` til að setja gögn inn í gagnagrunn og á Cloudinary
7. Keyra loks `npm start` og þá ætti að vera hægt að kalla á netþjónustuna m.a. með Postman

### Slóð á Heroku
Verkefnið er aðgengilegt á slóðinni: `https://atk6-aoa27-vef2-2021-h1.herokuapp.com`

Þaðan er hægt að kalla á vefþjónustuna m.a. með Postman.

## Dæmi um köll í vefþjónustu
* `POST` á `/tv` mun búa til nýjan sjónvarpsþátt. Sett inn t.d með postman með eftirfarandi key-value pör í body í form data (til að geta sett inn mynd)
```json
{
    "name": "Svaka sjónvarpsþáttur",
    "airDate": "2021-10-20",
    "inProduction": "false",
    "tagline": "Svaka tagline",
    "image": (í postman er hægt að velja file),
    "description": "Svaka lýsing",
    "language": "is",
    "network": "Svaka network",
    "url": "Svaka url"
}
```
* `GET` á `/tv/?offset=10&limit=10` mun skila blaðsíðu tvö af sjónvarpsþáttum sem eru til
* `POST` á `/tv/1/season/1/episode` með t.d. eftirfarandi json gögn í `Body` mun búa til nýjan þátt ef notandi er admin
```json
{
    "name": "New episode",
    "number": 20,
    "airDate": "2020-02-02",
    "overview": "New episode"
}
```
* `DELETE` á `/tv/1/season/1` mun eyða þáttaröð 1 í sjónvarpsþætti 1 ásamt öllum þeim þáttum sem eru í þeirri þáttaröð ef notandi er admin
* `POST` á `/tv/1/rate` mun setja rating fyrir sjónvarpsþátt 1 fyrir innskráðan notanda og eftirfarandi í body
```json
{
    "rating": "5",
}
```
* `PATCH` á `/users/me` mun gera breytingar á þeim gildum sem skilgreind eru hér að neðan á innskráðum notanda 
```json
{
    "email": "new@email.is",
    "password": "newPassword"
}
```

## Innskráning
Til að innskrá er framkvæmd `POST` kall á `/users/login`
### Admin
Hægt er að skrá sig inn sem admin með notendanafni `admin` og lykilorði `123`.
Það er gert m.a. með því að skrifa eftirfarandi kóða í `Body` með kalli á netþjónustuna:
```json
{
  "username": "admin",
  "password": 123
}
```
### Almennur notandi
Hægt er að skrá sig inn sem almennur notandi með notendanafninu `jon` og lykilorði `123`.
Það er gert m.a. með því að skrifa eftirfarandi kóða í `Body` með kalli á netþjónustuna:
```json
{
  "username": "jon",
  "password": 123
}
```

## Lýsing á verkefni
Útfæra skal vefþjónustur fyrir sjónvarpsþáttavef:

* Gefin eru/verða gögn fyrir sjónvarpsþætti, season og staka þætti sem flytja þarf inn í gagnagrunn
* Hægt er að skoða öll gögn um sjónvarpsþætti án innskráningar
* Notendaumsjón
  * Stjórnendur sem geta breytt, bætt við, og eytt sjónvarpsþáttum, seasons og stökum þáttum
  * Notendum sem geta skráð sína „stöðu“ fyrir sjónvarpsþátt, season og staka þætti

## Notendaumsjón

Notendaumsjón skiptist í þrennt: óauðkenndur notandi, notendur og stjórnendur.

* Óauðkenndur notandi getur skoðað öll gögn.
* Óauðkenndur notandi getur skráð sig og skráð sig inn og orðið auðkenndur notandi.
* Notendum sem geta skráð sína „stöðu“ fyrir sjónvarpsþátt. Stöður eru:
  * `Langar að horfa`
  * `Er að horfa`
  * `Hef horft`
* Notendur geta skráð einkunn fyrir sjónvarpsþátt, heiltölugildi frá og með 0 til og með 5
* Stjórnendur geta breytt, bætt við, og eytt sjónvarpsþáttum, seasons og stökum þáttum.
  * Stjórnendur geta gert aðra notendur að stjórnendum.

Nota skal JWT með passport og geyma notendur i gagnagrunni. Útfæra þarf auðkenningu, nýskráningu notanda og middleware sem passar upp á heimildir stjórnenda og notenda.

Útbúa skal í byrjun:

* Einn stjórnanda með notandanafn `admin` og þekkt lykilorð, skrá skal lykilorð í `README` verkefnis.
* Einn almennan notanda sem hefur vistaðar stöður á einhverjum af gefnum þáttum, season, þáttum, skrá skal upplýsingar um notanda í `README`
  * Þessi notandi er til þess að einfalda yfirferð á verkefni.

## Töflur

Skilgreina skal töflur fyrir:

* Sjónvarpsþætti
  * Nafn, strengur, ekki tómt
  * Fyrst sjónvarpað, dagsetning, má vera tóm
  * Í framleiðslu?, boolean
  * „Tagline“, strengur, má vera tóm
  * Mynd, vísun í slóð, ekki tóm
  * Lýsing, strengur, má vera tóm
  * Tungumál, strengur (tæknilega `ISO 639-1` kóði fyrir tungumál), krafa en ekki þarf að staðfesta að gildi sé ISO 639-1
  * Sjónvarpsstöð (e. network), strengur
  * Vefsíða, strengur (url), má vera tómt
* Sjónvarpsþáttategund
  * Nafn, strengur, ekki tómt
* Tengitafla milli sjónvaprsþátta og sjónvarpsþáttategundar
  * Vísun í sjónvarpsþátt
  * Vísun í sjónvarpsþáttategund
* Season af sjónvarpsþáttum
  * Nafn, strengur, ekki tómt
  * Númer, heiltala, stærri en 0, krafa
  * Fyrst sjónvarpað, dagsetning, má vera tóm
  * Lýsing, strengur, má vera tóm
  * Poster, vísun í slóð, ekki tóm
  * Vísun í sjónvarpsþátt
* Þætti
  * Nafn, strengur, ekki tómt
  * Númer, heiltala, stærri en 0, krafa
  * Fyrst sjónvarpað, dagsetning, má vera tóm
  * Lýsing, strengur, má vera tóm
  * Vísun í season
* Notendur
  * Notendanafn, einstakt, krafist
  * Netfang, einstakt, krafist
  * Lykilorð, krafist, a.m.k. 10 stafir, geymt sem hash úr bcrypt
  * Stjórnandi, boolean, sjálfgefið false
* Tengitafla fyrir notendur og sjónvarpsþætti
  * Vísun í sjónvarpsþátt
  * Vísun í notanda
  * Staða, má vera tóm, eitt af `Langar að horfa`, `Er að horfa`, `Hef horft` (hægt að nota strengi eða `enum`)
  * Einkunn, má vera tóm, heiltala, `0`, `1`, `2`, `3`, `4`, `5`

Töflur skulu hafa auðkenni og nota [_foreign keys_](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK) þegar vísað er í aðrar töflur.

Nota þarf _join_ til að sameina gögn notanda við sjónvarpsþáttagögn. Sjá dæmi í fyrirlestri 5.

## Gögn

Þegar verkefni er sett upp skal færa inn gögn sem gefin eru í `data/` möppu.

* `data/series.csv` inniheldur 20 sjónvarpsseríur. `serieId` skilgreinir auðkenni innan gagna.
* `data/seasons.csv` inniheldur season fyrir allar sjónvarpsseríur. Dálkurinn `serieId` vísar í auðakenni þáttaraðar.
* `data/episodes.csv` inniheldur þætti fyrir öll season. Dálkurinn `serieId` vísar í auðakenni þáttaraðar.

Þar sem vísað er í myndir er sú mynd í `data/img` möppu.

Gögnin eru fengin frá [The Movie Database](https://www.themoviedb.org/) og eru gögnin 20 vinsælustu þáttaraðirnar í febrúar 2021.

## Myndir

Gefnar eru myndir fyrir sjónvarpsþætti í `img/`.

Allar myndir skal geyma í [Cloudinary](https://cloudinary.com/), bæði þær sem settar eru upp í byrjun og þær sem sendar eru inn gegnum vefþjónustu. Við notum Cloudinary þar sem boðið er upp á ókeypis aðgang, án kreditkorts.

Aðeins ætti að leyfa myndir af eftirfarandi tegund (`mime type`):

* jpg, `image/jpeg`
* png, `image/png`
* gif, `image/gif`

[Þó svo að Cloudinary styðji fleiri tegundir](https://cloudinary.com/documentation/image_transformations#supported_image_formats), þá er hægt að staðfesta að við höfum mynd _áður_ en uploadað á Cloudinary.

## Vefþjónustur

Útfæra skal vefþjónustur til að útfæra alla virkni. Nota skal `JSON` í öllum samskiptum.

GET á `/` skal skila lista af slóðum í mögulegar aðgerðir.

Þegar eining er búin til skal það aðeins gert ef notandi er stjórnandi og eining er rétt.

Ekki þarf að útfæra meira en tilgreint er (t.d. eyða, uppfæra tegund; uppfæra season; uppfæra sjónvarpsþátt).

Ef beðið er um einingu sem ekki er til skal skila `404`.

Ef beðið er um einingu eða reynt að framkvæma aðgerð sem ekki er leyfi fyrir skal skila `401`.

### Sjónvarpsþættir

* `/tv`
  * `GET` skilar síðum af sjónvarpsþáttum með grunnupplýsingum
  * `POST` býr til nýjan sjónvarpsþátt, aðeins ef notandi er stjórnandi
* `/tv/:id`
  * `GET` skilar stöku sjónvarpsþáttum með grunnupplýsingum, meðal einkunn sjónvarpsþáttar, fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt, fylki af tegundum sjónvarpsþáttar (genres), fylki af seasons, rating notanda, staða notanda
  * `PATCH`, uppfærir sjónvarpsþátt, reit fyrir reit, aðeins ef notandi er stjórnandi
  * `DELETE`, eyðir sjónvarpsþátt, aðeins ef notandi er stjórnandi
* `/tv/:id/season/`
  * `GET` skilar fylki af öllum seasons fyrir sjónvarpsþátt
  * `POST` býr til nýtt í season í sjónvarpþætti, aðeins ef notandi er stjórnandi
* `/tv/:id/season/:id`
  * `GET` skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum
  * `DELETE`, eyðir season, aðeins ef notandi er stjórnandi
* `/tv/:id/season/:id/episode/`
  * `POST` býr til nýjan þátt í season, aðeins ef notandi er stjórnandi
* `/tv/:id/season/:id/episode/:id`
  * `GET` skilar upplýsingum um þátt
  * `DELETE`, eyðir þætti, aðeins ef notandi er stjórnandi
* `/genres`
  * `GET` skilar síðu af tegundum (genres)
  * `POST` býr til tegund, aðeins ef notandi er stjórnandi

### Notendur

* `/users/`
  * `GET` skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
* `/users/:id`
  * `GET` skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi
  * `PATCH` breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi og er ekki að breyta sér sjálfum
* `/users/register`
  * `POST` staðfestir og býr til notanda. Skilar auðkenni og netfangi. Notandi sem búinn er til skal aldrei vera stjórnandi
* `/users/login`
  * `POST` með netfangi (eða notandanafni) og lykilorði skilar token ef gögn rétt
* `/users/me`
  * `GET` skilar upplýsingum um notanda sem á token, auðkenni og netfangi, aðeins ef notandi innskráður
  * `PATCH` uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður

Aldrei skal skila eða sýna hash fyrir lykilorð.

### Sjónvarpsþættir og notendur

* `/tv/:id/rate`
  * `POST`, skráir einkunn innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
  * `PATCH`, uppfærir einkunn innskráðs notanda á sjónvarpsþætti
  * `DELETE`, eyðir einkunn innskráðs notanda á sjónvarpsþætti
* `/tv/:id/state`
  * `POST`, skráir stöðu innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
  * `PATCH`, uppfærir stöðu innskráðs notanda á sjónvarpsþætti
  * `DELETE`, eyðir stöðu innskráðs notanda á sjónvarpsþætti
* `/tv/:id`
  * Ef notandi er innskráður skal sýna einkunn og stöðu viðkomandi á sjónvarpsþætti.

## Annað

Allar niðurstöður sem geta skilað mörgum færslum (fleiri en 10) skulu skila _síðum_.

Ekki þarf að útfæra „týnt lykilorð“ virkni.

Lausn skal keyra á Heroku.

## Sýnilausn

Hægt er að skoða sýnilausn á: `https://vef2-2021-h1-synilausn.herokuapp.com/`.

Útfært:

* Gögn færð inn með myndum
* Óinnskráður notandi getur skoðað öll gögn

## Hópavinna

Verkefnið skal unnið í hóp, helst með þremur einstaklingum. Hópar með tveim eða fjórum einstaklingum eru einnig í lagi, ekki er dregið úr kröfum fyrir færri í hóp en gerðar eru auknar kröfur ef fleiri en þrír einstaklingar eru í hóp.

Hægt er að auglýsa eftir hóp á slack á rásinni #vef2-2021-hópur.

Hafið samband við kennara ef ekki tekst eða ekki er mögulegt að vinna í hóp.

## README

Í rót verkefnis skal vera `README.md` skjal sem tilgreinir:

* Upplýsingar um hvernig setja skuli upp verkefnið
* Dæmi um köll í vefþjónustu
* Innskráning fyrir `admin` stjórnanda ásamt lykilorði
* Innskráning fyrir almennan notanda ásamt lykilorði
* Nöfn og notendanöfn allra í hóp

## Mat

* 25% – Töflur og gögn lesin inn
* 25% – Auðkenning og notendaumsjón
* 50% — Vefþjónustur skilgreindar skv. forskrift

## Sett fyrir

Verkefni sett fyrir í fyrirlestri fimmtudaginn 4. febrúar 2021.

Verkefni fullmótað sett fyrir á Canvas sunnudaginn 21. febrúar 2021.

## Skil

Á Canvas eru skilgreindir 40 hópar (People > Hópverkefni 1) sem hópur þarf að skrá sig í. Fyrsti nemandi sem skráir sig er sjálfgefið hópstjóri.

Hópstjóri skilar fyrir hönd hóps á Canvas, í seinasta lagi fyrir lok dags sunnudaginn 21. mars 2021.

Skilaboð skulu innihalda slóð á GitHub repo fyrir verkefni, og dæmatímakennurum skal hafa verið boðið í repo ([sjá leiðbeiningar](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-your-github-user-account/inviting-collaborators-to-a-personal-repository)) ásamt slóð á verkefnið keyrandi á Heroku. Notendanöfn þeirra eru:

* `jonnigs`
* `mimiqkz`
* `Steinalicious`
* `zurgur`

Athugið að skilum fyrir verkefni lokar kl. 23:59 sunnudaginn 21. mars 2021.

## Einkunn

Sett verða fyrir 6 minni verkefni þar sem 5 bestu gilda 8% hvert, samtals 40% af lokaeinkunn.

Sett verða fyrir tvö hópverkefni þar sem hvort um sig gildir 10%, samtals 20% af lokaeinkunn.

---

> Útgáfa 0.4

| Útgáfa | Lýsing |
|--------|--------|
| 0.1    | _Fyrsta útgáfa_, ekki er búið að fullskilgreina vefþjónustuskil eða útbúa gögn í byrjun, stefnt á að verði komið 7.–8. febrúar. Nota skal tíma þangað til, til þess að finna hóp, skipta með sér verkum, ákveða samskipti, og skilgreina tímalínu fyrir vinnu á verkefninu. [Yfirferð í fyrirlestri 4](https://youtu.be/gQEFFKGumG0) |
| 0.2    | Lýsing á gögnum, lýsing á þjónustum, mat, gögn |
| 0.3    | Lagfæringar á lýsingu. Vísun á vefþjónustu sýnilausnar |
| 0.4    | /user/login má taka við notandanafni |
