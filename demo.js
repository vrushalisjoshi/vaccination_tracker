const Telegraf = require("telegraf").Telegraf;
const fetch = require("node-fetch");

require("dotenv").config({ path: __dirname + "/.env" });
let objHeaders = {
  "Content-Type": "application/json",
  "Accept-Language": "hi_IN",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
};

let statesUrl = `${process.env.COWIN_URL}admin/location/districts/${process.env.MH_ID}`;

fetch(statesUrl, {
  method: "GET",
  mode: "cors",
  headers: objHeaders,
})
  .then((res) => {
    return res.ok ? res.json() : res.text();
  })
  .then((json) => {
    if (json.districts) {
      json.districts.forEach((district) => {
        let botConst = eval(`process.env.${district.district_name.toUpperCase()}`);
        let bot = new Telegraf(botConst);
        bot.telegram.sendMessage(`@${district.district_name.toLowerCase().trim()}_${district.district_id}`, "Hello, Welcome!");
      });
    }
  })
  .catch((err) => {
    console.error(err);
  });
