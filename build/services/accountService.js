

app.factory('AccountService', function() {
  var activeAccount;

  return {
    setActiveAccount: setActiveAccount,
    getActiveAccount: getActiveAccount
  };

  function setActiveAccount(account) {
    activeAccount = account;
  }

  function getActiveAccount() {
    return activeAccount;
  }
});
