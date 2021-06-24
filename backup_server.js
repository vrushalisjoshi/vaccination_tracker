const express = require("express");
const fetch = require("node-fetch");
const cron = require("node-cron");
const Telegraf = require("telegraf").Telegraf;
const nextDate = require("./utils/GetNextDate");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();

const PORT = process.env.PORT || 5000;

const bot = new Telegraf(process.env.NEW_CHANNEL_TOKEN);
const bot1 = new Telegraf(process.env.NEW_CHANNEL_TOKEN1);
const bot2 = new Telegraf(process.env.NEW_CHANNEL_TOKEN2);
const bot3 = new Telegraf(process.env.NEW_CHANNEL_TOKEN3);
const bot4 = new Telegraf(process.env.NEW_CHANNEL_TOKEN4);
const arrBots = [bot, bot1, bot2, bot3, bot4];
let finalBot;

let arrData = [];
let arrMessages = [];
let arrDistricts = [];
let arrUrls = [];

let objHeaders = {
  "Content-Type": "application/json",
  "Accept-Language": "hi_IN",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
};

let sessionUrl = `${process.env.COWIN_URL}appointment/sessions/public/calendarByDistrict?district_id=`;
let statesUrl = `${process.env.COWIN_URL}admin/location/districts/${process.env.MH_ID}`;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});

cron.schedule(`*/${process.env.MSG_CRON_SEC} * * * * *`, () => {
  console.log(`Sending messages every ${process.env.MSG_CRON_SEC} seconds!`);
  console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  sendMessages()();
});

console.log(nextDate());

const sendMessages = () => {
  return (request, response, next) => {
    if (arrMessages) {
      let nextBot = 0;
      while (arrMessages.length) {
        finalBot = arrBots[nextBot];
        let message = arrMessages.shift();
        finalBot.telegram
          .sendMessage(process.env.AURANGABAD_CHAT_ID, message)
          .then(() => {
            console.log(arrMessages.length + " : messages to be sent!");
          })
          .catch((err) => {
            console.log("message not sent, added again");
            arrMessages.unshift(message);
          });
        nextBot = nextBot > arrBots.length ? 0 : nextBot + 1;
      }
    } else {
      response.status(204);
      response.send("No districts data");
    }
  };
};

const getVaccinationUpdates = () => {
  return (request, response, next) => {
    arrUrls = arrUrls.filter(String);

    if (arrUrls) {
      const promises = arrUrls.map((url) =>
        fetch(url, {
          method: "GET",
          mode: "cors",
          headers: objHeaders,
        })
          .then((res) => res.json())
          .then((json) => {
            return json;
          })
      );

      return Promise.all(promises)
        .then((results) => {
          if (results) {
            results.forEach((district) => {
              if (district.centers) {
                district.centers.forEach((centre) => {
                  if (centre.sessions) {
                    centre.sessions.forEach((session) => {
                      if (!arrData[session.session_id]) {
                        arrData[session.session_id] = 0;
                      }

                      if (session.available_capacity && session.available_capacity > 0 && arrData[session.session_id] != session.available_capacity) {
                        let message = `Vaccination available for age group ( ${session.min_age_limit}+ )
                                    \n on Date: ${session.date}
                                    \n Center Name: ${centre.name}
                                    \n PINCODE: ${centre.pincode}
                                    \n Vaccine: ${session.vaccine}
                                    \n Slots: ${session.slots}
                                    \n Fee Type: ${centre.fee_type}
                                    \n Dose1 Availability: ${session.available_capacity_dose1}
                                    \n Dose2 Availability: ${session.available_capacity_dose2}`;

                        arrData[session.session_id] = session.available_capacity;
                        arrMessages.push(message);
                      }
                    });
                  }
                });
              }
            });
            response.send(results);
          }
        })
        .catch((err) => {
          console.error(err);
          response.status(500);
          response.send(err);
        });
    } else {
      response.status(204);
      response.send("No districts data");
    }
  };
};

const getDistricts = () => {
  return (request, response, next) => {
    fetch(statesUrl, {
      method: "GET",
      mode: "cors",
      headers: objHeaders,
    })
      .then((res) => {
        return res.ok ? res.json() : res.text();
      })
      .then((json) => {
        if (response && json.districts) {
          json.districts.forEach((district) => {
            arrUrls[district.district_id] = `${sessionUrl}${district.district_id}&date=` + nextDate();
            arrDistricts.push({ district_id: district.district_id, district_name: district.district_name, channel_name: `${district.district_name.split(" ").join("_").toLowerCase()}_${district.district_id}_covid_vaccine_tracking` });
          });
          next();
        }
      })
      .catch((err) => {
        console.error(err);
        response.status(500);
        response.send(err);
      });
  };
};

app.get("/", getDistricts(), getVaccinationUpdates());

app.get("/states", getDistricts());
