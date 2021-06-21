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
let arrCenterData = [];
let arrMessages = [];

console.log(nextDate());

let url = `${process.env.COWIN_URL}appointment/sessions/public/calendarByDistrict?district_id=${process.env.ABD_ID}&date=`;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});

cron.schedule("*/60 * * * * *", () => {
  console.log("running a task every 60 seconds!");
  console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  getVaccinationUpdates()();
});

cron.schedule("*/60 * * * * *", () => {
  console.log("Sending 20 messages every 60 seconds!");
  console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  sendMessages();
});

const sendMessages = () => {
  let msgCount = 0;

  while (arrMessages.length && 20 > msgCount) {
    let message = arrMessages.shift();
    bot.sendMessage(process.env.telegram_chat_id, message);
    console.log(message);
    msgCount++;
  }
};

const getVaccinationUpdates = () => {
  return (request, response) => {
    fetchUrl = url + nextDate();
    fetch(fetchUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "hi_IN",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
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
                if (!arrData[session.session_id]) {
                  arrData[session.session_id] = 0;
                  arrCenterData[session.session_id] = {};
                }

                if (session.available_capacity && session.available_capacity > 0 && arrData[session.session_id] != session.available_capacity) {
                  let message = `Vaccination available for age group ( ${session.min_age_limit}+ )
                                    \n on Date: ${session.date}
                                    \n Center Name: ${centre.name}
                                    \n PINCODE: ${centre.pincode}
                                    \n Vaccine: ${session.vaccine}
                                    \n Slots: ${session.slots}
                                    \n Dose1 Availability: ${session.available_capacity_dose1}
                                    \n Dose2 Availability: ${session.available_capacity_dose2}`;

                  arrData[session.session_id] = session.available_capacity;
                  arrCenterData[session.session_id] = {
                    name: centre.name,
                    pincode: centre.pincode,
                    capacity: session.available_capacity,
                  };
                  arrMessages.push(message);
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
