const getNextDate = () => {
  var today = new Date();
  var dd = today.getDate() + 1;
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  return dd + "-" + mm + "-" + yyyy;
};
module.exports = getNextDate;
