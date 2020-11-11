google.charts.load("current", { packages: ["corechart", "line"] });

(function () {
  let tickerPriceData = [];
  getTickerOverview("IBM");
  getTickerPriceData("IBM");
  createUserStockList();
})();

function getTickerListData(userList) {
  let numberOfTickers = userList.length;
  let list = userList.join(",");
  let parsedData = [];

  fetch(
    `http://api.marketstack.com/v1/eod?access_key=9a1f6570075e0b0e76f95b75c571461e&symbols=${list}`
  )
    .then((resp) => resp.json())
    .then((data) => {

      for (var i = 0; i < numberOfTickers; i++) {
        console.log(data.data[i]);
        let percentageChange =
          ((data.data[i].close - data.data[i + numberOfTickers].close) /
            data.data[i + numberOfTickers].close) *
          100;
        parsedData.push({
          ticker: data.data[i].symbol,
          price: data.data[i].close,
          change: Number(percentageChange.toFixed(2)),
          volume: data.data[i].volume,
          date: data.data[i].date.split("T")[0],
        });
      }
      makeTable(parsedData)
    });
}

function makeTable(listData) {
    var stocklist = document.getElementById('stockwatchlist');
    stocklist.innerHTML = ''
    for (let result of listData) {
        console.log(result)
        let htmlString = "";
        htmlString += `<tr id="tablerow">
        <td id="removeList" onclick="removeTickerFromUserList('${result.ticker}')"><i class="material-icons md-light">remove_circle</i></td>
        <td>${result.ticker}</td>
        <td>${result.price} </td>`;
        if (result.change >= 0) {
        htmlString += `
        <td><i class="material-icons md-light">trending_up</i> 
        ${result.change}</td>
        `}
        else {
        htmlString += `
        <td><i class="material-icons md-light">trending_down</i> 
        ${result.change}</td>`
        }
        htmlString +=
        `<td>${result.volume} </td>
        </tr>\n`
        stocklist.innerHTML += htmlString;
    }
    return;
}  

// Aks to extract share prices if search matches the listing
function submit() {
    var stock = document.getElementById('stocksearch').value;
    if (stocks.includes(stock)) {
        addTickerToUserList(stock)
    }
    else {
      sendError()
    }
  }

function sendError() {
    const newMessage = document.getElementById('errormessage');
    newMessage.innerHTML = 'Not Found'
}

function createUserStockList() {
    let userList = JSON.parse(localStorage.getItem("userList")) || [];
    getTickerListData(userList)
}

function addTickerToUserList(ticker) {
  let userList = JSON.parse(localStorage.getItem("userList")) || [];
  userList.push(ticker);
  localStorage.setItem("userList", JSON.stringify(userList));
  createUserStockList();
}

function removeTickerFromUserList(ticker) {
    console.log(ticker)
  let userList = JSON.parse(localStorage.getItem("userList")) || [];
  userList = userList.filter((item) => item !== ticker);
  localStorage.setItem("userList", JSON.stringify(userList));
  createUserStockList();
}

/**
 * Makes call to Alphavantage API and gets ticker overview in JSON-format
 * @param {string} ticker
 */
function getTickerOverview(ticker) {
  fetch(
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=PH5C1GN8BH39WZ4K`
  )
    .then((resp) => resp.json())
    .then((data) => {
      createTickerStats(data);
    });
}

function createTickerStats(data) {
  console.log(data);
  console.log(data.Symbol);
  let symbol = data.Symbol;
  document.getElementById("tickerSymbol").textContent = symbol;

  let average = data["50DayMovingAverage"]
  let low = data["52WeekLow"]
  let high = data["52WeekHigh"]
  let country = data.Country
  let currency = data.Currency
  let dividendyield = data.DividendYield
  let marketcap = data.MarketCapitalization
  let sector = data.Sector
  document.getElementById('average').textContent = average
  document.getElementById('low').textContent = low
  document.getElementById('high').textContent = high
  document.getElementById('sector').textContent = sector
  document.getElementById('country').textContent = country
  document.getElementById('currency').textContent = currency
  document.getElementById('dividendyield').textContent = dividendyield
  document.getElementById('marketcap').textContent = marketcap
}

/**
 * Makes call to Alphavantage API and gets ticker daily price data in JSON-format
 * Data is then converted to datatable array format [date,price]
 * @param {string} ticker
 */
function getTickerPriceData(ticker) {
  fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=PH5C1GN8BH39WZ4K`
  )
    .then((resp) => resp.json())
    .then((data) => {
      let priceObject = data["Time Series (Daily)"];
      let dataTable = [];
      for (let date in priceObject) {
        dataTable.push([new Date(date), Number(priceObject[date]["4. close"])]);
      }
      tickerPriceData = dataTable;
      drawTickerPriceChart("5Y");
    });
}

/**
 * Waits until google charts is loaded and draws ticker price chart to element with id of 'tickerPriceChart' and updates priceChartHeader
 * @param {array} dataTable
 */
function drawTickerPriceChart(timePeriod) {
  let numberOfBusinessDays = getNumberOfBusinessDays(timePeriod);
  let priceData = filterPriceData(numberOfBusinessDays);
  google.charts.setOnLoadCallback(drawChart(priceData));
  updateLatestPrice(priceData);
  updateSelectedTimeFrame(timePeriod);
}

/**
 * Changes selected timeframe color to blue
 * @param {string} timePeriod
 */
function updateSelectedTimeFrame(timePeriod) {
  const timeFrame = document.getElementById("timeFrame").children;
  var array = Array.from(timeFrame);
  array.forEach((item) => {
    if (item.textContent == timePeriod) {
      item.style.color = "rgb(22, 82, 240)";
    } else {
      item.style.color = "rgb(177, 177, 177)";
    }
  });
}

/**
 * Filters priceData from numberOfBusiness days
 * @param {number} numberOfBusinessDays
 */
function filterPriceData(numberOfBusinessDays) {
  let priceData = [];
  tickerPriceData.forEach((price, index) => {
    if (index < numberOfBusinessDays) {
      priceData.push(price);
    }
  });
  return priceData;
}

/**
 * Draws google chart
 * @param {array} priceData
 */
function drawChart(priceData) {
  var data = new google.visualization.DataTable();
  data.addColumn("date", "Date");
  data.addColumn("number", "Price");
  data.addRows(priceData);

  var options = {
    hAxis: {
      format: "dd/MM/yyyy",
      title: "Date",
      gridlines: {
        color: "transparent",
        count: -1,
      },
    },

    timeline: { showBarLabels: false },
    legend: {
      position: "none",
    },
    vAxis: {
      title: "Price",
      gridlines: {
        color: "transparent",
      },
    },
    chartArea: { left: 0, top: 20, width: "100%", height: "80%" },
  };
  var chart = new google.visualization.LineChart(
    document.getElementById("tickerPriceChart")
  );
  chart.draw(data, options);
}

/**
 * Adds latest price info to chart header
 * @param {array} priceData
 */
function updateLatestPrice(priceData) {
  let latestPrice = priceData[0][1];
  let yesterDayPrice = priceData[1][1];
  let number = latestPrice.toFixed(0);
  let decimal = (latestPrice + "").split(".")[1];
  let percentageChange =
    ((latestPrice - yesterDayPrice) / yesterDayPrice) * 100;
  let tickerPrice = document.getElementById("tickerPrice");
  tickerPrice.textContent = number;

  let tickerPriceDecimal = document.getElementById("tickerPriceDecimal");
  tickerPriceDecimal.textContent = "." + decimal;

  let tickerPercentageChange = document.getElementById(
    "tickerPercentageChange"
  );
  let percentageChangeText = percentageChange.toFixed(2) + "%";
  let sign = "+";
  if (percentageChange < 0) {
    sign = "";
  }

  tickerPercentageChange.textContent = sign + percentageChangeText;
  if (percentageChange >= 0) {
    tickerPercentageChange.style.color = "rgb(5, 177, 105)";
  } else {
    tickerPercentageChange.style.color = "rgb(223, 95, 103)";
  }
}

/**
 * Returns number of business days in a period
 * @param {string} timePeriod
 */
function getNumberOfBusinessDays(timePeriod) {
  console.log(timePeriod);
  let numberOfBusinessDays = 0;
  if (timePeriod === "1W") {
    numberOfBusinessDays = 5;
  } else if (timePeriod === "1M") {
    numberOfBusinessDays = 30;
  } else if (timePeriod === "1Y") {
    numberOfBusinessDays = 252;
  } else if (timePeriod === "5Y") {
    numberOfBusinessDays = 1260;
  } else if (timePeriod === "10Y") {
    numberOfBusinessDays = 2520;
  } else if (timePeriod === "ALL") {
    numberOfBusinessDays = 5040;
  }
  return numberOfBusinessDays;
}

// Asset searcher section //

let stocks = [
  "ABT",
  "ABBV",
  "ACN",
  "ACE",
  "ADBE",
  "ADT",
  "AAP",
  "AES",
  "AET",
  "AFL",
  "AMG",
  "A",
  "GAS",
  "APD",
  "ARG",
  "AKAM",
  "AA",
  "AGN",
  "ALXN",
  "ALLE",
  "ADS",
  "ALL",
  "ALTR",
  "MO",
  "AMZN",
  "AEE",
  "AAL",
  "AEP",
  "AXP",
  "AIG",
  "AMT",
  "AMP",
  "ABC",
  "AME",
  "AMGN",
  "APH",
  "APC",
  "ADI",
  "AON",
  "APA",
  "AIV",
  "AMAT",
  "ADM",
  "AIZ",
  "T",
  "ADSK",
  "ADP",
  "AN",
  "AZO",
  "AVGO",
  "AVB",
  "AVY",
  "BHI",
  "BLL",
  "BAC",
  "BK",
  "BCR",
  "BXLT",
  "BAX",
  "BBT",
  "BDX",
  "BBBY",
  "BRK-B",
  "BBY",
  "BLX",
  "HRB",
  "BA",
  "BWA",
  "BXP",
  "BSK",
  "BMY",
  "BRCM",
  "BF-B",
  "CHRW",
  "CA",
  "CVC",
  "COG",
  "CAM",
  "CPB",
  "COF",
  "CAH",
  "HSIC",
  "KMX",
  "CCL",
  "CAT",
  "CBG",
  "CBS",
  "CELG",
  "CNP",
  "CTL",
  "CERN",
  "CF",
  "SCHW",
  "CHK",
  "CVX",
  "CMG",
  "CB",
  "CI",
  "XEC",
  "CINF",
  "CTAS",
  "CSCO",
  "C",
  "CTXS",
  "CLX",
  "CME",
  "CMS",
  "COH",
  "KO",
  "CCE",
  "CTSH",
  "CL",
  "CMCSA",
  "CMA",
  "CSC",
  "CAG",
  "COP",
  "CNX",
  "ED",
  "STZ",
  "GLW",
  "COST",
  "CCI",
  "CSX",
  "CMI",
  "CVS",
  "DHI",
  "DHR",
  "DRI",
  "DVA",
  "DE",
  "DLPH",
  "DAL",
  "XRAY",
  "DVN",
  "DO",
  "DTV",
  "DFS",
  "DISCA",
  "DISCK",
  "DG",
  "DLTR",
  "D",
  "DOV",
  "DOW",
  "DPS",
  "DTE",
  "DD",
  "DUK",
  "DNB",
  "ETFC",
  "EMN",
  "ETN",
  "EBAY",
  "ECL",
  "EIX",
  "EW",
  "EA",
  "EMC",
  "EMR",
  "ENDP",
  "ESV",
  "ETR",
  "EOG",
  "EQT",
  "EFX",
  "EQIX",
  "EQR",
  "ESS",
  "EL",
  "ES",
  "EXC",
  "EXPE",
  "EXPD",
  "ESRX",
  "XOM",
  "FFIV",
  "FB",
  "FAST",
  "FDX",
  "FIS",
  "FITB",
  "FSLR",
  "FE",
  "FSIV",
  "FLIR",
  "FLS",
  "FLR",
  "FMC",
  "FTI",
  "F",
  "FOSL",
  "BEN",
  "FCX",
  "FTR",
  "GME",
  "GPS",
  "GRMN",
  "GD",
  "GE",
  "GGP",
  "GIS",
  "GM",
  "GPC",
  "GNW",
  "GILD",
  "GS",
  "GT",
  "GOOGL",
  "GOOG",
  "GWW",
  "HAL",
  "HBI",
  "HOG",
  "HAR",
  "HRS",
  "HIG",
  "HAS",
  "HCA",
  "HCP",
  "HCN",
  "HP",
  "HES",
  "HPQ",
  "HD",
  "HON",
  "HRL",
  "HSP",
  "HST",
  "HCBK",
  "HUM",
  "HBAN",
  "ITW",
  "IR",
  "INTC",
  "ICE",
  "IBM",
  "IP",
  "IPG",
  "IFF",
  "INTU",
  "ISRG",
  "IVZ",
  "IRM",
  "JEC",
  "JBHT",
  "JNJ",
  "JCI",
  "JOY",
  "JPM",
  "JNPR",
  "KSU",
  "K",
  "KEY",
  "GMCR",
  "KMB",
  "KIM",
  "KMI",
  "KLAC",
  "KSS",
  "KRFT",
  "KR",
  "LB",
  "LLL",
  "LH",
  "LRCX",
  "LM",
  "LEG",
  "LEN",
  "LVLT",
  "LUK",
  "LLY",
  "LNC",
  "LLTC",
  "LMT",
  "L",
  "LOW",
  "LYB",
  "MTB",
  "MAC",
  "M",
  "MNK",
  "MRO",
  "MPC",
  "MAR",
  "MMC",
  "MLM",
  "MAS",
  "MA",
  "MAT",
  "MKC",
  "MCD",
  "MHFI",
  "MCK",
  "MJN",
  "MMV",
  "MDT",
  "MRK",
  "MET",
  "KORS",
  "MCHP",
  "MU",
  "MSFT",
  "MHK",
  "TAP",
  "MDLZ",
  "MON",
  "MNST",
  "MCO",
  "MS",
  "MOS",
  "MSI",
  "MUR",
  "MYL",
  "NDAQ",
  "NOV",
  "NAVI",
  "NTAP",
  "NFLX",
  "NWL",
  "NFX",
  "NEM",
  "NWSA",
  "NEE",
  "NLSN",
  "NKE",
  "NI",
  "NE",
  "NBL",
  "JWN",
  "NSC",
  "NTRS",
  "NOC",
  "NRG",
  "NUE",
  "NVDA",
  "ORLY",
  "OXY",
  "OMC",
  "OKE",
  "ORCL",
  "OI",
  "PCAR",
  "PLL",
  "PH",
  "PDCO",
  "PAYX",
  "PNR",
  "PBCT",
  "POM",
  "PEP",
  "PKI",
  "PRGO",
  "PFE",
  "PCG",
  "PM",
  "PSX",
  "PNW",
  "PXD",
  "PBI",
  "PCL",
  "PNC",
  "RL",
  "PPG",
  "PPL",
  "PX",
  "PCP",
  "PCLN",
  "PFG",
  "PG",
  "PGR",
  "PLD",
  "PRU",
  "PEG",
  "PSA",
  "PHM",
  "PVH",
  "QRVO",
  "PWR",
  "QCOM",
  "DGX",
  "RRC",
  "RTN",
  "O",
  "RHT",
  "REGN",
  "RF",
  "RSG",
  "RAI",
  "RHI",
  "ROK",
  "COL",
  "ROP",
  "ROST",
  "RLC",
  "R",
  "CRM",
  "SNDK",
  "SCG",
  "SLB",
  "SNI",
  "STX",
  "SEE",
  "SRE",
  "SHW",
  "SIAL",
  "SPG",
  "SWKS",
  "SLG",
  "SJM",
  "SNA",
  "SO",
  "LUV",
  "SWN",
  "SE",
  "STJ",
  "SWK",
  "SPLS",
  "SBUX",
  "HOT",
  "STT",
  "SRCL",
  "SYK",
  "STI",
  "SYMC",
  "SYY",
  "TROW",
  "TGT",
  "TEL",
  "TE",
  "TGNA",
  "THC",
  "TDC",
  "TSO",
  "TXN",
  "TXT",
  "HSY",
  "TRV",
  "TMO",
  "TIF",
  "TWX",
  "TWC",
  "TJK",
  "TMK",
  "TSS",
  "TSCO",
  "RIG",
  "TRIP",
  "FOXA",
  "TSN",
  "TYC",
  "UA",
  "UNP",
  "UNH",
  "UPS",
  "URI",
  "UTX",
  "UHS",
  "UNM",
  "URBN",
  "VFC",
  "VLO",
  "VAR",
  "VTR",
  "VRSN",
  "VZ",
  "VRTX",
  "VIAB",
  "V",
  "VNO",
  "VMC",
  "WMT",
  "WBA",
  "DIS",
  "WM",
  "WAT",
  "ANTM",
  "WFC",
  "WDC",
  "WU",
  "WY",
  "WHR",
  "WFM",
  "WMB",
  "WEC",
  "WYN",
  "WYNN",
  "XEL",
  "XRX",
  "XLNX",
  "XL",
  "XYL",
  "YHOO",
  "YUM",
  "ZBH",
  "ZION",
  "ZTS",
];

const searchInput = document.querySelector("#autocomplete");
const suggestionsPanel = document.querySelector(".suggestions");

searchInput.addEventListener("keyup", () => {
  const input = searchInput.value.toUpperCase();
  suggestionsPanel.innerHTML = "";
  const suggestions = stocks.filter((stocks) => {
    return stocks.startsWith(input);
  });
  suggestions.forEach((suggested) => {
    const div = document.createElement("div");
    div.addEventListener("click", () => selectTicker(suggested));

    div.innerHTML = suggested;
    suggestionsPanel.appendChild(div);
  });
  if (input === "") {
    suggestionsPanel.innerHTML = "";
  }
});

const selectTicker = (ticker) => {
  let tickerPriceData = [];
  getTickerOverview(ticker);
  getTickerPriceData(ticker);

  suggestionsPanel.innerHTML = "";
};
