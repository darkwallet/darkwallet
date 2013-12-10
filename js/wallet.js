var password = prompt("Password");

chrome.storage.cipher = {
  identities: new Database('identities', ''),
  contacts: new Database('contacts', password),
  addresses: new Database('addresses', password),
  transactions: new Database('transactions', password)
};

