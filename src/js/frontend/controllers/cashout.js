'use strict';

define(['./module', 'darkwallet', 'dwutil/currencyformat'], function (controllers, DarkWallet, CurrencyFormat) {
  controllers.controller('CashoutCtrl', ['$scope', '$http', '$timeout', '$location', '$window', 'modals', '_Filter', function($scope, $http, $timeout, $location, $window, modals, _) {
    var identity = DarkWallet.getIdentity();

    $scope.page = "screen1";
    $scope.send = {phone: "", amount: 10, country: "ES", server: identity.settings.cashout_url || ""};
    $scope.status = "";
    $scope.qrcode = "";
    $scope.lastpage = "";
    $scope.terms = '';

    var checkTimeout = null;
    var createTimeout = null;

    $scope.start = function() {
        $scope.page = "screen1";
    }

    $scope.showLegal = function() {
        $window.open($scope.legal, '_blank');
    }

    $scope.getConditions = function(server) {
        $http.get(server+"hello").
            success(function(data, status, headers, config) {
                $scope.btcPrice = data.price;
                $scope.timeout = data.timeout;
                $scope.legal = data.terms;
                $scope.fixedFee = data.fixed_fee;
                $scope.dailyLimit = data.daily_limit;
                $scope.monthlyLimit = data.monthly_limit;
                $scope.variableFee = data.variable_fee;
                $scope.send.connected = true;
                var parser = document.createElement('a');
                parser.href = server;
                $scope.serviceTitle = data.title || parser.hostname;
                identity.settings.cashout_url = server;
                identity.store.save();
            }).
            error(function(data, status, headers, config) {
            });
    }

    /*
     * Get some variables from local storage
     */
    var tickets = {};
    $scope.tickets = tickets;
    $scope.allTickets = [];
    if (identity.settings.cashoutTickets) {
        identity.settings.cashoutTickets.forEach(function(ticket) {
            tickets[ticket.id] = ticket;
            $scope.allTickets.push(ticket.id);
        });
    }

    /*
     * Check an address
     */

    $scope.checkTicket = function() {
        checkTimeout = null;
        $scope.status = "checking";
        $http.get($scope.send.server+"check/"+$scope.txId+"/"+$scope.send.phone).
            success(function(data, status, headers, config) {
                var btcAmount = data.btc;
                var confirmations = data.confirmations;
                tickets[$scope.txId].status = "checked";
                tickets[$scope.txId].confirmations = confirmations;
                $scope.status = "checked";
                if (btcAmount && confirmations >= 0) {
                    tickets[$scope.txId].result = data;
                    tickets[$scope.txId].finished = true;
                    tickets[$scope.txId].status = data.status;
                    tickets[$scope.txId].ticketId = data.ticket;
                    $scope.status = "confirmed";
                } else if (data.status === 'expired') {
                    $scope.qrcode = "";
                    tickets[$scope.txId].status = 'expired';
                }
                identity.store.save();
            }).
            error(function(data, status, headers, config) {
                checkTimeout = $timeout($scope.checkTicket, 5000);
            });
    }

    /*
     * Cancel a ticket
     */
    $scope.cancel = function(status) {
       $scope.page = "screen1";
       $scope.send.phone = "";
       if ($scope.txId) {
           tickets[$scope.txId].status = 'cancelled';
       }
       delete $scope.txId;
       delete $scope.currentTicket;
       $scope.status = status || "";
       if (checkTimeout) {
           $timeout.cancel(checkTimeout);
           checkTimeout = null;
       }
    };


    $scope.openTicket = function(ticket) {
        $scope.currentTicket = ticket;
        $scope.page = "screen2";
        $scope.qrcode = "bitcoin:"+ticket.address+"?amount="+ticket.btcamount/100000000+"&message=Cashout";
        $scope.send.amount = ticket.amount;
        $scope.send.phone = ticket.phone;
        $scope.send.country = ticket.country;
        $scope.pin = ticket.pin;
        $scope.txId = ticket.id;
        $scope.send.server = ticket.endpoint || identity.settings.cashout_url;
    };

    /*
     * Keep trying to create a ticket
     */
    var postRetry = function() {
        $http.post($scope.send.server+"send", { country: $scope.send.country,
                          phone_number: $scope.send.phone,
                          amount: $scope.send.amount }).
            success(function(data, status, headers, config) {
              // this callback will be called asynchronously
              // when the response is available
              $scope.status = (data.status === 'ok') ? "" : data.status;
              tickets[data.id] = {timestamp: Date.now(),
                                  type: 'hal',
                                  // server data:
                                  btcamount: data.amount,
                                  amount: $scope.send.amount,
                                  pin: data.pin,
                                  id: data.id,
                                  address: data.address,
                                  status: 'created',
                                  endpoint: $scope.send.server,
                                  confirmations: -1,
                                  // form data:
                                  phone: $scope.send.phone,
                                  country: $scope.send.country};

              // Go to the ticket subpage
              $scope.openTicket(tickets[data.id]);

              // Check once
              checkTimeout = $timeout($scope.checkTicket, 5000);

              // save ticket in cache
              $scope.allTickets.push(data.id);

              if (!identity.settings.cashoutTickets) {
                  identity.settings.cashoutTickets = [];
              }
              identity.settings.cashoutTickets.push(tickets[data.id]);
              identity.store.save();
            }).
            error(function(data, status, headers, config) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
              $scope.status = "Error querying server";
              createTimeout = $timeout(1000, function() {
                  createTimeout = null;
                  postRetry();
              });
            });
    };

    $scope.payTicket = function() {
        var identity = DarkWallet.getIdentity();
        $scope.forms.send = { mixing: true,
                        sending: false,
                        sendPocket: 0,
                        autoAddEnabled: false,
                        propagated: false,
                        identity: identity.name,
                        fee: CurrencyFormat.asBtc(identity.wallet.fee),
                        advanced: false };

        var amount = CurrencyFormat.asBtc($scope.currentTicket.btcamount);

        $scope.forms.send.recipients = {
            fields: [
                { address: $scope.currentTicket.address, amount: amount.toString() }
            ],
            field_proto: { address: '', amount: '' }
        };
        $location.path('/send');
    };

    /*
     * Go to the paying page
     */
    $scope.nextPage = function() {
        var number = $scope.send.phone;
        if (!number) {
            $scope.status = _("Missing phone");
        } else if (number < 99999999) {
            $scope.status = _("Bad phone");
        /*} else if (!isValid) {
            $scope.status = "Bad Phone Number";*/
        } else if (!$scope.send.amount) {
            $scope.status = _("Missing amount");
        } else if (isNaN(parseInt($scope.send.amount)) || parseInt($scope.send.amount) !== parseFloat($scope.send.amount) || parseInt($scope.send.amount)%10) {
            $scope.status = _("Incorrect amount");
        } else if (parseInt($scope.send.amount) > $scope.dailyLimit) {
            $scope.status = _("Amount too large, max is ") + $scope.dailyLimit + " EUR";
        } else {
            $scope.send.phone = number;
            $scope.status = _("sending");
            postRetry();
        }
    };

    $scope.$on('$destroy', function() {
        if (checkTimeout) {
            $timeout.cancel(checkTimeout);
        }
        if (createTimeout) {
            $timeout.cancel(createTimeout);
        }
    });

    $scope.toggleSettings = function() {
        if ($scope.page === 'settings') {
            $scope.page = $scope.lastPage;
        } else {
            $scope.lastPage = $scope.page;
            $scope.page = 'settings';
        }
    };

    $scope.toggleTickets = function() {
        if ($scope.page === 'tickets') {
            $scope.page = $scope.lastPage;
        } else {
            $scope.lastPage = $scope.page;
            $scope.page = 'tickets';
        }
    };


    $scope.clearServer = function() {
        //$scope.send.server = '';
        $scope.send.connected = false;
        
        //delete identity.settings.cashout_url;
        //identity.store.save();
    };

    $scope.connectService = function() {
        var serverUrl = $scope.send.server;
        if (serverUrl.indexOf("api/") !== -1) {
            $scope.page = "screen1";
            modals.open('confirm', {message: _('Are you sure?'), detail: _('This will connect to a remote service that can record your interaction with them.')}, function() {
                $scope.getConditions(serverUrl);
            });
        } else {
            $scope.send.connected = false;
        }
    };

    /*
    $scope.$watch('send.server', function(serverUrl) {
        $scope.connectService();
    });*/
}]);

});
