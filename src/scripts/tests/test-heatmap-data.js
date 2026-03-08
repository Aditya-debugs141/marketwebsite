"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var market_service_1 = require("./src/lib/market-service");
(0, market_service_1.fetchDeepMarketData)()
    .then(function (data) {
    console.log(JSON.stringify(data[0], null, 2));
})
    .catch(console.error);
