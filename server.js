const express = require("express");
const fetch = require("node-fetch");
const cron = require("node-cron");
const Telegraf = require("telegraf").Telegraf;
const nextDate = require("./utils/GetNextDate");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();

const PORT = process.env.PORT || 5000;

let arrData = [];
let arrMessages = [];
let arrDistricts = [];

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

cron.schedule(`*/${process.env.FETCH_CRON_SEC} * * * * *`, () => {
  console.log(`Cron running every ${process.env.FETCH_CRON_SEC} seconds! : ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}`);
  getDistricts();
});

console.log(nextDate());

const sendMessages = (bot, botName, district_id) => {
  if (arrMessages[district_id]) {
    while (arrMessages[district_id].length) {
      let message = arrMessages[district_id].shift();
      bot.telegram
        .sendMessage(botName, message)
        .then(() => {
          console.log(arrMessages[district_id].length + " : messages to be sent!");
        })
        .catch((err) => {
          console.log("message not sent, added again");
          arrMessages[district_id].unshift(message);
        });
    }
  } else {
    console.log("No districts data");
  }
};

const getVaccinationUpdates = () => {
  if (arrDistricts && arrDistricts.length) {
    arrDistricts.map((objDistrict) => {
      let botConst = eval(`process.env.${objDistrict.district_name.toUpperCase()}`);
      let botName = process.env.ABD_ID == objDistrict.district_id ? process.env.AURANGABAD_CHAT_ID : `@${objDistrict.district_name.toLowerCase().trim()}_${objDistrict.district_id}`;
      let bot = new Telegraf(botConst);
      let strurl = `${sessionUrl}${objDistrict.district_id}&date=` + nextDate();

      fetch(strurl, {
        method: "GET",
        mode: "cors",
        headers: objHeaders,
      })
        .then((res) => res.json())
        .then((district) => {
          if (district.centers) {
            arrMessages[objDistrict.district_id] = [];
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
                    arrMessages[objDistrict.district_id].push(message);
                  }
                });
              }
            });
            sendMessages(bot, botName, objDistrict.district_id);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
  } else {
    console.log("No districts data");
  }
};

const getDistricts = () => {
  fetch(statesUrl, {
    method: "GET",
    mode: "cors",
    headers: objHeaders,
  })
    .then((res) => {
      return res.ok ? res.json() : res.text();
    })
    .then((json) => {
      return json.districts;
    })
    .then((districts) => {
      arrDistricts = districts;
      console.log(arrDistricts);

      getVaccinationUpdates();
    })
    .catch((err) => {
      console.error(err);
    });
};
