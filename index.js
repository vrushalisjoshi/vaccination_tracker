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

let arrData = [];

console.log(nextDate());

let url = `${process.env.COWIN_URL}appointment/sessions/public/calendarByDistrict?district_id=${process.env.ABD_ID}&date=`;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});

cron.schedule("*/1 * * * *", () => {
  console.log("running a task every 1 minute!");
  console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  getVaccinationUpdates()();
});

const getVaccinationUpdates = () => {
  return (request, response) => {
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
        if (response) {
          response.send(json);
        }
        if (json.centers) {
          json.centers.forEach((centre) => {
            if (centre.sessions) {
              centre.sessions.forEach((session) => {
                if (!arrData[session.session_id])
                  arrData[session.session_id] = 0;
                if (
                  session.available_capacity &&
                  session.available_capacity > 0
                ) {
                  if (
                    arrData[session.session_id] != session.available_capacity
                  ) {
                    arrData[session.session_id] = session.available_capacity;
                    let message = `Vaccination available for age group ( ${session.min_age_limit}+ )
                                    \n on Date: ${session.date}
                                    \n Center Name: ${centre.name}
                                    \n PINCODE: ${centre.pincode}
                                    \n Vaccine: ${session.vaccine}
                                    \n Slots: ${session.slots}
                                    \n Dose1 Availability: ${session.available_capacity_dose1}
                                    \n Dose2 Availability: ${session.available_capacity_dose2}`;
                    bot.sendMessage(process.env.telegram_chat_id, message);
                  }
                }
              });
            }
          });
        }
      })
      .catch((err) => {
        console.error(err);
        response.status(500);
        response.send(err);
      });
  };
};

app.get("/", getVaccinationUpdates());
