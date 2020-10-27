google.charts.load('current', {packages: ['corechart', 'line']});

(function() {
    getTickerOverview('IBM')
    getTickerPriceData('IBM')
})();

/**
 * Makes call to Alphavantage API and gets ticker overview in JSON-format
 * @param {string} ticker 
 */
function getTickerOverview(ticker){
    fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=demo`)
        .then((resp) => resp.json())
        .then(data =>{
            console.log(data)
        })
}

/**
 * Makes call to Alphavantage API and gets ticker daily price data in JSON-format
 * Data is then converted to datatable array format [date,price]
 * @param {string} ticker 
 */
function getTickerPriceData(ticker){
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=demo`)
        .then((resp) => resp.json())
        .then(data =>{
            let priceObject = data['Time Series (Daily)']
            let dataTable = []
            for(let date in priceObject){
                dataTable.push([
                    new Date(date),
                    Number(priceObject[date]["4. close"])
                ])
            }
            google.charts.setOnLoadCallback(
                drawTickerPriceChart(dataTable)
            );
        })
}


/**
 * Draws ticker price chart to element with id of 'tickerPriceChart'
 * @param {array} dataTable 
 */
function drawTickerPriceChart(dataTable) {
    var data = new google.visualization.DataTable();
    
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Price');
    data.addRows(dataTable);

    var options = {
    hAxis: {
        format:'dd/MM/yy',
        title: 'Date',
    },
    vAxis: {
        title: 'Price',
    }
    };
    var chart = new google.visualization.LineChart(document.getElementById('tickerPriceChart'));
    chart.draw(data, options);
}