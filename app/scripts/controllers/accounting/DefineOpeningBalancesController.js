(function (module) {
    mifosX.controllers = _.extend(module, {
        DefineOpeningBalancesController: function (scope, resourceFactory, location, translate, routeParams, dateFilter) {
            scope.first = {};
            scope.formData = {};
            scope.first.date = new Date();
            scope.accountClosures = [];
            scope.restrictDate = new Date();
            resourceFactory.officeResource.getAllOffices(function (data) {
                scope.offices = data;
            });

            resourceFactory.currencyConfigResource.get({fields: 'selectedCurrencyOptions'}, function (data) {
                scope.currencyOptions = data.selectedCurrencyOptions;
                scope.formData.currencyCode = scope.currencyOptions[0].code;
            });

            scope.submit = function () {
                var reqDate = dateFilter(scope.first.date, scope.df);
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                this.formData.transactionDate = reqDate;
                this.formData.currencyCode = scope.formData.currencyCode;
                this.formData.credits = [];
                this.formData.debits = [];
                var noErrors = true;
                for (var i in scope.allGls) {
                    if (scope.allGls[i].credit && scope.allGls[i].credit != "" && scope.allGls[i].debit && scope.allGls[i].debit != "") {
                        if(noErrors){
                            scope.errorDetails = [];
                            noErrors = false;
                            var errorObj = new Object();
                            errorObj.code = 'error.msg.accounting.defining.openingbalance.both.credit.debits.are.passed';
                            scope.errorDetails.push(errorObj);
                        }
                    } else if (scope.allGls[i].debit && scope.allGls[i].debit != "") {
                        this.formData.debits.push({"glAccountId":scope.allGls[i].glAccountId, "amount":scope.allGls[i].debit});
                    } else if (scope.allGls[i].credit && scope.allGls[i].credit) {
                        this.formData.credits.push({"glAccountId":scope.allGls[i].glAccountId, "amount":scope.allGls[i].credit});
                    }
                }
                if(noErrors){
                    delete scope.errorDetails;
                    resourceFactory.journalEntriesResource.save({command:"defineOpeningBalance"}, this.formData, function (data) {
                        location.path('/viewtransactions/' + data.transactionId);
                    });
                }
            }

            scope.updateDebitCreditAmounts = function (gl) {
                if (gl.amount) {
                    if (gl.entryType) {
                        if (gl.entryType.value == "DEBIT") {
                            gl.debit = gl.amount;
                        } else if (gl.entryType.value == "CREDIT") {
                            gl.credit = gl.amount;
                        }
                    }
                }
            }

            scope.mergeAllGLs = function () {
                scope.allGls = [];
                scope.debitTotal = 0;

                _.each(scope.data.assetAccountOpeningBalances, function(gl){
                    scope.updateDebitCreditAmounts(gl);
                    scope.allGls.push(gl);
                });

                _.each(scope.data.liabityAccountOpeningBalances, function(gl){
                    scope.updateDebitCreditAmounts(gl);
                    scope.allGls.push(gl);
                });

                _.each(scope.data.equityAccountOpeningBalances, function(gl){
                    scope.updateDebitCreditAmounts(gl);
                    scope.allGls.push(gl);
                });

                _.each(scope.data.incomeAccountOpeningBalances, function(gl){
                    scope.updateDebitCreditAmounts(gl);
                    scope.allGls.push(gl);
                });

                _.each(scope.data.expenseAccountOpeningBalances, function(gl){
                    scope.updateDebitCreditAmounts(gl);
                    scope.allGls.push(gl);
                });
                
            }

            scope.retrieveOpeningBalances = function (officeId) {
                resourceFactory.officeOpeningResource.get({officeId: officeId}, function (data) {
                    scope.data = data;
                    scope.mergeAllGLs();
                });
            }
        }
    });
    mifosX.ng.application.controller('DefineOpeningBalancesController', ['$scope', 'ResourceFactory', '$location', '$translate', '$routeParams', 'dateFilter', mifosX.controllers.DefineOpeningBalancesController]).run(function ($log) {
        $log.info("DefineOpeningBalancesController initialized");
    });
}(mifosX.controllers || {}));
