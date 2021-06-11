const getNextDate = () => {
  let today = (new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).split(","))[0];
  today = today.split('/');
  var mm = parseInt(today[0]);
  var dd = parseInt(today[1]);
  var yyyy = parseInt(today[2]);

  return dd + "-" + mm + "-" + yyyy;
};
module.exports = getNextDate;
