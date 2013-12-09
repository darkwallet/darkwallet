var obSocket = new WebSocket("ws://localhost:9000");

console.log("starting socket");

obSocket.onopen = function (event) {
  console.log("socket started, getting height")
  obSocket.send("getheight");
};

obSocket.onmessage = function (event) {
  console.log("height arrived");
  console.log(event);
  console.log(event.type);
  console.log(event.data);
  console.log(JSON.parse(event.data));
}
