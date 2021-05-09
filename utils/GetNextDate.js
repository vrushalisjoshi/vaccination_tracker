const getNextDate = () => {
  let today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  let dd = today.getDate() + 1;
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();

  return dd + "-" + mm + "-" + yyyy;
};
module.exports = getNextDate;
