"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSectorData = fetchSectorData;
exports.fetchDeepMarketData = fetchDeepMarketData;
var stock_nse_india_1 = require("stock-nse-india");
var nse = new stock_nse_india_1.NseIndia();
// Exact NSE Index Names
var SECTOR_INDICES = [
    'NIFTY BANK',
    'NIFTY IT',
    'NIFTY AUTO',
    'NIFTY PHARMA',
    'NIFTY METAL',
    'NIFTY FMCG',
    'NIFTY ENERGY',
    'NIFTY REALTY'
];
function fetchSectorData() {
    return __awaiter(this, void 0, void 0, function () {
        var response, allIndices_1, results, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, nse.getDataByEndpoint('/api/allIndices')];
                case 1:
                    response = _a.sent();
                    allIndices_1 = (response === null || response === void 0 ? void 0 : response.data) || [];
                    results = SECTOR_INDICES.map(function (name) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        var idx = allIndices_1.find(function (i) { return i.index === name; });
                        if (idx) {
                            return {
                                name: name,
                                change: (typeof idx.perChange === 'number' ? idx.perChange : parseFloat(idx.perChange)) || 0,
                                value: (typeof idx.last === 'number' ? idx.last : parseFloat(idx.last)) || 0,
                                weight: 10 // Placeholder
                            };
                        }
                        return null;
                    });
                    return [2 /*return*/, results.filter(function (item) { return item !== null; })];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching sector data from NSE:", error_1);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Deep Fetch for Heatmap (Sector -> Stocks)
function fetchDeepMarketData() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, SECTOR_INDICES_1, sector, response, stocks, children, topChildren, err_1, validResults, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    results = [];
                    _i = 0, SECTOR_INDICES_1 = SECTOR_INDICES;
                    _a.label = 1;
                case 1:
                    if (!(_i < SECTOR_INDICES_1.length)) return [3 /*break*/, 7];
                    sector = SECTOR_INDICES_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, nse.getDataByEndpoint("/api/equity-stockIndices?index=".concat(encodeURIComponent(sector)))];
                case 3:
                    response = _a.sent();
                    stocks = (response === null || response === void 0 ? void 0 : response.data) || [];
                    children = stocks.map(function (s) { return ({
                        name: s.symbol,
                        value: s.totalTradedValue || (s.lastPrice * s.totalTradedVolume), // Size in Treemap
                        price: s.lastPrice,
                        change: s.pChange,
                        volume: s.totalTradedVolume
                    }); }).filter(function (s) { return s.value > 0; });
                    topChildren = children.sort(function (a, b) { return b.value - a.value; }).slice(0, 15);
                    results.push({
                        name: sector.replace('NIFTY ', ''),
                        value: topChildren.reduce(function (acc, c) { return acc + c.value; }, 0),
                        children: topChildren
                    });
                    // Small delay to prevent NSE rate limiting
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 4:
                    // Small delay to prevent NSE rate limiting
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.error("Failed to fetch constituents for ".concat(sector, ":"), err_1);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    validResults = results;
                    console.log("[DEBUG] Deep Market Data Fetched: ".concat(validResults.length, " sectors"));
                    return [2 /*return*/, validResults];
                case 8:
                    error_2 = _a.sent();
                    console.error("Error fetching deep market data:", error_2);
                    return [2 /*return*/, []];
                case 9: return [2 /*return*/];
            }
        });
    });
}
