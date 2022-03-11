require('dotenv').config({path: './.env'});
const express = require("express");
const telegram = require("telegram");
const telegramSession = require("telegram/sessions");
const app = express();
const port = 3000;

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_ID_HASH;
const stringSession = new telegramSession.StringSession('');

const client = new telegram.TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
  useWSS: false,
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.post("/sendcode", async (req, res) => {
  await client.connect();
  const { phoneNumber } = req.body;
  const { phoneCodeHash } = await client.invoke(
    new telegram.Api.auth.SendCode({
      phoneNumber,
      apiId,
      apiHash,
      settings: new telegram.Api.CodeSettings({
        allowFlashcall: true,
        currentNumber: true,
        allowAppHash: true,
      }),
    }),
  );
  res.json({phoneCodeHash, message: "ok" });
});

app.post("/signin", async (req, res) => {
  await client.connect();
  const { phoneNumber, phoneCode, phoneCodeHash } = req.body
  await client.invoke(
    new telegram.Api.auth.SignIn({phoneNumber, phoneCode, phoneCodeHash}),
  );
  const session = await client.session.save();
  const userInfo = await client.getMe();
  res.json({
    session,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    username: userInfo.username,
    phone: userInfo.phone,
    id: userInfo.id
});
});

app.post("/signout", async (req, res) => {
  await client.connect();
  await client.invoke(
    new telegram.Api.auth.LogOut({}),
  );
  res.json({message: "logout"});
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});