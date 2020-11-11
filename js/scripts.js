google.charts.load('current', {packages: ['corechart', 'line']});



(function() {
    let tickerPriceData = []
    getTickerOverview('IBM')
    getTickerPriceData('IBM')
    createUserStockList()
})();

function createUserStockList(){
    let userStockList = document.getElementById('userStockList')
    userStockList.innerHTML = ''
    let userList = JSON.parse(localStorage.getItem('userList'))||[]
    userList.forEach(item =>{
        let ticker = document.createElement('li')
        ticker.textContent = item
        ticker.addEventListener('click',()=>removeTickerFromUserList(item))
        userStockList.appendChild(ticker)
    })
}

function addTickerToUserList(){
    const ticker = document.getElementById('userListInput').value
    let userList = JSON.parse(localStorage.getItem('userList'))||[]
    userList.push(ticker)
    localStorage.setItem('userList',JSON.stringify(userList))
    createUserStockList()
}

function removeTickerFromUserList(ticker){
    let userList = JSON.parse(localStorage.getItem('userList'))||[]
    userList=userList.filter(item => item!==ticker)
    localStorage.setItem('userList',JSON.stringify(userList))
    createUserStockList()
}

/**
 * Makes call to Alphavantage API and gets ticker overview in JSON-format
 * @param {string} ticker 
 */
function getTickerOverview(ticker){
    fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=demo`)
        .then((resp) => resp.json())
        .then(data =>{
            createTickerStats(data)
        })
}


function createTickerStats(data){
    console.log(data)
    console.log(data.Symbol) 
    let symbol = data.Symbol
    document.getElementById('tickerSymbol').textContent = symbol
    
    let average = data["50DayMovingAverage"]
    let low = data["52WeekHigh"]
    let high = data["52WeekLow"]
    let country = data.Country
    let currency = data.Currency
    let dividendyield = data.DividendYield
    let marketcap = data.MarketCapitalization
    let sector = data.Sector
    document.getElementById('average').textContent =`50 Day Moving Average: ${average}`
    document.getElementById('low').textContent =`52 Week Low: ${low}`
    document.getElementById('high').textContent =`52 Week High: ${high}`
    document.getElementById('sector').textContent =`Sector: ${sector}`
    document.getElementById('country').textContent =`Country: ${country}`
    document.getElementById('currency').textContent =`Currency: ${currency}`
    document.getElementById('dividendyield').textContent =`Dividend Yield: ${dividendyield}`
    document.getElementById('marketcap').textContent =`Market Cap: ${marketcap}`
}

/**
 * Makes call to Alphavantage API and gets ticker daily price data in JSON-format
 * Data is then converted to datatable array format [date,price]
 * @param {string} ticker 
 */
function getTickerPriceData(ticker){
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=demo`)
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
            tickerPriceData = dataTable
            drawTickerPriceChart('5Y')
        })
}


/**
 * Waits until google charts is loaded and draws ticker price chart to element with id of 'tickerPriceChart' and updates priceChartHeader
 * @param {array} dataTable 
 */
function drawTickerPriceChart(timePeriod){
    let numberOfBusinessDays = getNumberOfBusinessDays(timePeriod)
    let priceData = filterPriceData(numberOfBusinessDays)
    google.charts.setOnLoadCallback(drawChart(priceData));
    updateLatestPrice(priceData)
    updateSelectedTimeFrame(timePeriod)
}


/**
 * Changes selected timeframe color to blue
 * @param {string} timePeriod 
 */
function updateSelectedTimeFrame(timePeriod){
    const timeFrame = document.getElementById('timeFrame').children
    var array = Array.from(timeFrame)
    array.forEach(item =>{
        if(item.textContent==timePeriod ){
            item.style.color = 'rgb(22, 82, 240)'
        }else{
            item.style.color = 'rgb(177, 177, 177)'
        }
    })
}

/**
 * Filters priceData from numberOfBusiness days
 * @param {number} numberOfBusinessDays 
 */
function filterPriceData(numberOfBusinessDays){
    let priceData = []
    tickerPriceData.forEach((price,index) =>{
        if(index<numberOfBusinessDays){
            priceData.push(price)
        }
    })
    return priceData
}

/**
 * Draws google chart 
 * @param {array} priceData 
 */
function drawChart(priceData){
    
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Price');
    data.addRows(priceData);

    var options = {
    hAxis: {
        format:'dd/MM/yyyy',
        title: 'Date',
        gridlines: {
            color: 'transparent',
            count: -1
        }
    },
    
    timeline: { showBarLabels: false },
    legend: {
        position: 'none'
        },
    vAxis: {
        title: 'Price',
        gridlines: {
            color: 'transparent'
        }
    },
    chartArea:{left:0,top:20,width:"100%",height:"80%"}
    };
    var chart = new google.visualization.LineChart(document.getElementById('tickerPriceChart'));
    chart.draw(data, options);        
}

/**
 * Adds latest price info to chart header
 * @param {array} priceData 
 */
function updateLatestPrice(priceData){
    let latestPrice = priceData[0][1]
    let yesterDayPrice =  priceData[1][1]
    let number = latestPrice.toFixed(0)
    let decimal = (latestPrice + "").split(".")[1]
    let percentageChange = ((latestPrice-yesterDayPrice)/yesterDayPrice)*100
    let tickerPrice = document.getElementById('tickerPrice')
    tickerPrice.textContent=number
    
    let tickerPriceDecimal = document.getElementById('tickerPriceDecimal')
    tickerPriceDecimal.textContent ='.'+decimal
    
    let tickerPercentageChange = document.getElementById('tickerPercentageChange')
    let percentageChangeText = percentageChange.toFixed(2)+'%'
    let sign='+'
    if(percentageChange<0){
        sign = ''
    }

    tickerPercentageChange.textContent = sign+percentageChangeText
    if(percentageChange>=0){
        tickerPercentageChange.style.color='rgb(5, 177, 105)'
    }else{
        tickerPercentageChange.style.color='rgb(223, 95, 103)'
    }
}

/**
 * Returns number of business days in a period
 * @param {string} timePeriod 
 */
function getNumberOfBusinessDays(timePeriod){
    console.log(timePeriod)
    let numberOfBusinessDays=0
    if(timePeriod === '1W'){
        numberOfBusinessDays = 5
    }else if(timePeriod==='1M'){
        numberOfBusinessDays = 30
    }else if(timePeriod==='1Y'){
        numberOfBusinessDays = 252
    }else if(timePeriod==='5Y'){
        numberOfBusinessDays = 1260
    }else if(timePeriod==='10Y'){
        numberOfBusinessDays = 2520
    }else if(timePeriod==='ALL'){
        numberOfBusinessDays = 5040
    }
    return numberOfBusinessDays
}