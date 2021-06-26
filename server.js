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
  getVaccinationUpdates();
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
  arrDistricts = [
    {
      district_id: 391,
      district_name: "Ahmednagar",
    },
    {
      district_id: 364,
      district_name: "Akola",
    },
    {
      district_id: 366,
      district_name: "Amravati",
    },
    {
      district_id: 397,
      district_name: "Aurangabad ",
    },
    {
      district_id: 384,
      district_name: "Beed",
    },
    {
      district_id: 370,
      district_name: "Bhandara",
    },
    {
      district_id: 367,
      district_name: "Buldhana",
    },
    {
      district_id: 380,
      district_name: "Chandrapur",
    },
    {
      district_id: 388,
      district_name: "Dhule",
    },
    {
      district_id: 379,
      district_name: "Gadchiroli",
    },
    {
      district_id: 378,
      district_name: "Gondia",
    },
    {
      district_id: 386,
      district_name: "Hingoli",
    },
    {
      district_id: 390,
      district_name: "Jalgaon",
    },
    {
      district_id: 396,
      district_name: "Jalna",
    },
    {
      district_id: 371,
      district_name: "Kolhapur",
    },
    {
      district_id: 383,
      district_name: "Latur",
    },
    {
      district_id: 395,
      district_name: "Mumbai",
    },
    {
      district_id: 365,
      district_name: "Nagpur",
    },
    {
      district_id: 382,
      district_name: "Nanded",
    },
    {
      district_id: 387,
      district_name: "Nandurbar",
    },
    {
      district_id: 389,
      district_name: "Nashik",
    },
    {
      district_id: 381,
      district_name: "Osmanabad",
    },
    {
      district_id: 394,
      district_name: "Palghar",
    },
    {
      district_id: 385,
      district_name: "Parbhani",
    },
    {
      district_id: 363,
      district_name: "Pune",
    },
    {
      district_id: 393,
      district_name: "Raigad",
    },
    {
      district_id: 372,
      district_name: "Ratnagiri",
    },
    {
      district_id: 373,
      district_name: "Sangli",
    },
    {
      district_id: 376,
      district_name: "Satara",
    },
    {
      district_id: 374,
      district_name: "Sindhudurg",
    },
    {
      district_id: 375,
      district_name: "Solapur",
    },
    {
      district_id: 392,
      district_name: "Thane",
    },
    {
      district_id: 377,
      district_name: "Wardha",
    },
    {
      district_id: 369,
      district_name: "Washim",
    },
    {
      district_id: 368,
      district_name: "Yavatmal",
    },
  ];
  if (arrDistricts.length) {
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
                    let message = ` \n Vaccine: ${session.vaccine} \n Age Group: ${session.min_age_limit}+ 
                                    \n Date: ${session.date} 
                                    \n ${centre.district_name} \n PINCODE: ${centre.pincode} \n Center: ${centre.name} 
                                    \n Dose1 Availability: ${session.available_capacity_dose1} \n Dose2 Availability: ${session.available_capacity_dose2} \n Fee: `;
                    let feeMsg = `Free`;
                    if (centre.vaccine_fees) {
                      let objVaccine = centre.vaccine_fees.find((objVaccine) => {
                        if (objVaccine.vaccine == session.vaccine) return objVaccine;
                      });
                      if (objVaccine && objVaccine.fee) {
                        feeMsg = `₹ ${objVaccine.fee}`;
                      }
                    }
                    message = message + feeMsg;
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

// const getDistricts = () => {
//   fetch(statesUrl, {
//     method: "GET",
//     mode: "cors",
//     headers: objHeaders,
//   })
//     .then((res) => {
//       return res.ok ? res.json() : res.text();
//     })
//     .then((json) => {
//       return json.districts;
//     })
//     .then((districts) => {
//       arrDistricts = districts;
//       getVaccinationUpdates();
//     })
//     .catch((err) => {
//       console.error(err);
//     });
// };
