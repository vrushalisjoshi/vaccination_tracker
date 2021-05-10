const express = require("express");
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");
var cron = require("node-cron");
const nextDate = require("./utils/GetNextDate");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();

const PORT = process.env.PORT || 5000;

const bot = new TelegramBot(process.env.TOKEN, {
  polling: true,
});

console.log(nextDate());
console.log(process.env.COWIN_URL);

let url = `${process.env.COWIN_URL}appointment/sessions/public/calendarByDistrict?district_id=397&date=`;

app.get("/", (req, resp) => {
  fetchUrl = url + nextDate();
  console.log(fetchUrl);
  fetch(fetchUrl, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "hi_IN",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
    },
  })
    .then((res) => {
      return res.ok ? res.json() : res.text();
    })
    .then((json) => {
      resp.send(json);
      if (json.centers) {
        json.centers.forEach((centre) => {
          if (centre.sessions && centre.sessions[0].available_capacity > 0) {
            let message = `Vaccination available for age group ( ${centre.sessions[0].min_age_limit}+ )
            \n on Date: ${centre.sessions[0].date}
            \n Center Name: ${centre.name}
            \n PINCODE: ${centre.pincode}
            \n Vaccine: ${centre.sessions[0].vaccine}
            \n Slots: ${centre.sessions[0].slots}
            \n Availability count: ${centre.sessions[0].available_capacity}`;
            bot.sendMessage(process.env.telegram_chat_id, message);
          }
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
      res.send(err);
    });
});

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});

cron.schedule("*/30 * * * * *", () => {
  console.log("running a task every 30 seconds!");
  console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  getVaccinationUpdates();
});

const getVaccinationUpdates = () => {
  fetchUrl = url + nextDate();
  console.log(fetchUrl);
  fetch(fetchUrl, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "hi_IN",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
    },
  })
    .then((res) => {
      return res.ok ? res.json() : res.text();
    })
    .then((json) => {
      if (json.centers) {
        json.centers.forEach((centre) => {
          console.log("--------------------------");
          if (centre.sessions) {
            console.log(
              `Center: ${centre.name}, Availability: ${centre.sessions[0].available_capacity}`
            );
          }
          if (centre.sessions && centre.sessions[0].available_capacity > 0) {
            let message = `Vaccination available for age group ( ${centre.sessions[0].min_age_limit}+ )
            \n on Date: ${centre.sessions[0].date}
            \n Center Name: ${centre.name}
            \n PINCODE: ${centre.pincode}
            \n Vaccine: ${centre.sessions[0].vaccine}
            \n Slots: ${centre.sessions[0].slots}
            \n Availability count: ${centre.sessions[0].available_capacity}`;
            bot.sendMessage(process.env.telegram_chat_id, message);
          }
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
      res.send(err);
    });
};
