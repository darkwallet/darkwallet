var password = prompt("Password");
var prev_err = false;

function onLoad(err) {
  if (!prev_err && err) {
    prev_err = true;
    alert("Invalid password");
    window.close();
  }
}

chrome.storage.cipher = {
  identities: new Database('identities', ''),
  contacts: new Database('contacts', password, onLoad),
  addresses: new Database('addresses', password, onLoad),
  transactions: new Database('transactions', password, onLoad)
};

function WalletCtrl($scope) {
  $scope.section = "history";
}

