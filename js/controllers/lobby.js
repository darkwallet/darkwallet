
function LobbyCtrl($scope, toaster) {
    $scope.pairCode = '';
    $scope.requests = [];
    $scope.subscribed = false;
    $scope.announceSelf = function() {
        client = DarkWallet.getClient();
        // chan tests
        if (!$scope.subscribed) {
        client.chan_subscribe("b", "announcements", function(err, data){
            if (!err) {
                $scope.subscribed = true;
            }
            console.log("channel subscribe", err, data)
        }, function(_data) {
            console.log("data for channel", _data);
            $scope.requests.push(_data);

            if(!$scope.$$phase) {
                $scope.$apply();
            }
        });
        }
        client.chan_post("b", "announcements", "hi " + $scope.pairCode, function(err, data){console.log("channel post", err, data)})
        client.chan_get("b", "announcements", function(err, data){console.log("channel get", err, data)})
        client.chan_list("b", function(err, data){console.log("channel list", err, data)})
 
    }
}
