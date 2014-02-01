
function ObeliskClient() {
    
}

ObeliskClient.prototype.connect = function(connectUri, handleConnect) {
    this.client = new GatewayClient(connectUri, handleConnect);
}

ObeliskClient.prototype.getClient = function() {
    return this.client;
}
