'use strict';
let stocks = {
  "Meta Data": {
    "1. Information": "Daily Time Series with Splits and Dividend Events",
    "2. Symbol": "AAPL",
    "3. Last Refreshed": "2020-11-03",
    "4. Output Size": "Compact",
    "5. Time Zone": "US/Eastern"
  },
  "Time Series (Daily)": {
    "2020-11-03": {
      "1. open": "109.6600",
      "2. high": "111.4900",
      "3. low": "108.7300",
      "4. close": "110.4400",
      "5. adjusted close": "110.4400",
      "6. volume": "107624448",
      "7. dividend amount": "0.0000",
      "8. split coefficient": "1.0"
    },
    "2020-11-08": {
      "1. open": "109.1100",
      "2. high": "110.6800",
      "3. low": "107.3200",
      "4. close": "108.7700",
      "5. adjusted close": "108.7700",
      "6. volume": "122866899",
      "7. dividend amount": "0.0000",
      "8. split coefficient": "1.0"
    },
    "2020-10-30": {
      "1. open": "111.0600",
      "2. high": "111.9900",
      "3. low": "107.7200",
      "4. close": "108.8600",
      "5. adjusted close": "108.8600",
      "6. volume": "190573476",
      "7. dividend amount": "0.0000",
      "8. split coefficient": "1.0"
    }
  }
}

const mydata = stocks["Time Series (Daily)"]
var stocklist = document.getElementById('stockwatchlist');

function plot() {
  console.log("Filling in tables")
  function sample() {
    const today = new Date().toISOString().substr(0, 10);
    const myreslt = [];
    for (let newdata in mydata) {
      if (newdata === today) {
        myreslt.push(
          Number(mydata[newdata]["1. open"]),
          Number(mydata[newdata]["2. high"]),
          Number(mydata[newdata]["3. low"]),
          (Number(mydata[newdata]["4. close"]))
        );
      }
    }
    return myreslt;
  }
  const result = sample();
  let htmlString = "";
  htmlString += `<tr>
  <td><i class="material-icons md-light">remove_circle</i><td>
  <td>${stock}</td>
  <td>${result[1]} </td>
  <td>${result[2]} </td>
  <td>${result[0]} </td>
  <td>${result[3]} </td>
  </tr>\n`
  stocklist.innerHTML = htmlString;
}


console.log(plot())

