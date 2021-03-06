var NLPRecord = new Array();
var stocksRecord = new Array();
var normalChatArr = ["Hi, how can I help you?","Is there anything I can help with?","Sure thing"];
var chatbotLoadingStr = "Neo is currently typing a response...";
var rateOfReturn = 0;
var JSONresponse = {};
var log = new Array();

/*****************Natural Language Processing********************/
function getInput() {
    log = $('#terminal').val().split("\n");
    var input = log[log.length - 1];

    if (input === "clear") {
        log = new Array();
        input = ""
        $('#terminal').val("");
        $("#console").val("");
    } else if (input === "new") {
    	var newDiv = '<div class="panel panel-default lobipanel" style="height:45vh;" data-sortable="true"><div class="panel-heading"><div class="panel-title"><h4>New Window</h4></div></div><textarea class="panel-body" type="text"></textarea>';
    	$("#console").append(newDiv).show();
    }

    return input;
}

function createLink(input) {
    var url = "https://api.projectoxford.ai/luis/v1/application/preview?id=526f6452-0231-4bef-afa5-a8c3c63d470e&subscription-key=baa34ae8054649a49229e587e3eff446&q=";
    var inputArray = input.split(" ");
    console.log("link: " + inputArray);
    for (i = 0, len = inputArray.length; i < len; i++) {
        url = url + inputArray[i] + "%20";
    }
    inputArray = new Array();
    return url;
}

function NLPTracker(url) {
    $.getJSON(url, function(data) {
        var entities = data.entities;
        var intent = data.topScoringIntent.intent;
        var entityInfo = {
            intent
        };
        if (entities.length !== 0) {
            for (i = 0; i < entities.length; i++) {
                switch (entities[i].type) {
                    case "stock_name":
                        entityInfo.stockName = entities[i].entity;
                        //console.log("entityInfo " + entityInfo.stockName);
                        break;
                    case "Date::start_date":
                        entityInfo.startDate = entities[i].entity;
                        break;
                    case "Date::end_date":
                        entityInfo.endDate = entities[i].entity;
                        break;
                    case "money":
                        entityInfo.money = entities[i].entity;
                        break;
                    case "want_ROR":
                        entityInfo.wantROR = entities[i].entity;
                        break;
                    case "ROR":
                        entityInfo.actualROR = entities[i].entity;
                        break;
                }
            }
            NLPRecord.push(entityInfo);
            console.log(entityInfo);

            var ticker = entityInfo.stockName;
            console.log(ticker);
            stockTracer(ticker, entityInfo);
        }
    });

}

/**********************Stock Info***********************/
function stockTracer(ticker, entityInfo) {
    var stockInfo = {
        "ticker": ticker
    };
    var url = "https://www.quandl.com/api/v3/datasets/WIKI/" + ticker + ".json?api_key=mSjmVxD7fpFDXBjUsYtT";
    console.log("the url: " + url);
    $.ajax({
        url: url,
        success: function(sdata) {
            var currStockPrice = sdata.dataset.data[0][1];
            stockInfo.currPrice = currStockPrice;
            var stockPrice2YearsAgo = sdata.dataset.data[600][1];
            var growthRate = (currStockPrice - stockPrice2YearsAgo) / stockPrice2YearsAgo;
            stockInfo.growthRate = Math.round(growthRate * 100);
            console.log(stockInfo);
            stocksRecord.push(stockInfo);
            consoleRst(stockInfo, entityInfo);
            plotStockPrice(sdata);
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function consoleRst(stockInfo, entityInfo) {
    switch (entityInfo.intent) {
        case "get_stock":
            getStockConsole(stockInfo);
            break;
        case "predict_trend":
            predictTrendConsole(stockInfo);
            break;
        case "None":
        	startRandomChat();
        	break;
    }
}

function getStockConsole(stockInfo) {
    var info = "> " + stockInfo.ticker + "</br>Current Price: " + stockInfo.currPrice + "</br>5-year CAGR: " + stockInfo.growthRate + "%</br>";
    console.log(info);
    $("#console").append(info).show();
}

function predictTrendConsole(stockInfo) {

	$("#console").append(info).show();
}

function startRandomChat() {
	var numOfChatMsgs = normalChatArr.length;
	var randNum = Math.floor((Math.random() * numOfChatMsgs) + 1);
	var chatMsg = normalChatArr[randNum];
	$("#console").append(chatMsg).show();
}

function setRateOfReturn(ror) {
    rateOfReturn = ror;
}

function getStockGrowthRate(stockInfo) {
    return stockInfo.growthRate;
}

function removeStocksNotInAcceptableRange(stock) {
    var acceptableRateOfReturnRangeMax = rateOfReturn + 8;
    var acceptableRateOfReturnRangeMin = rateOfReturn - 8;
    return (getStockGrowthRate(stock) < acceptableRateOfReturnRangeMax && getStockGrowthRate(stock) > acceptableRateOfReturnRangeMin)
}

function recommendFromCurrTrackedStocks() {
    setTimeout(10000);
    var recommendedStocks = currTrackedStocks;
    recommendedStocks.filter(removeStocksNotInAcceptableRange);
    console.log(recommendedStocks);
}

function plotStockPrice(sdata) {
    var figDiv = $("<div></div>")[0];
    figDiv.style = "width: 100%; height: 380px;"

    var stockdata = sdata.dataset.data;
    google.charts.load('current', {
        'packages': ['corechart']
    });
    google.charts.setOnLoadCallback(drawChart);

    function getData() {
        var newData = new Array();
        for (i = 0; i < 10; i++){
            var dataSlice = stockdata[i].slice(0, 5);
            newData.push(dataSlice);
        }
        return newData;
    }

    function drawChart() {
        var data = google.visualization.arrayToDataTable(getData(), true);
        var options = {
            legend: 'none'
        };
        console.log(figDiv);
        var chart = new google.visualization.CandlestickChart(figDiv);
        chart.draw(data, options);
      }

      $("#console").append(figDiv).show();
    }

    /************************Main*****************************/
    $(document).ready(function() {
        setRateOfReturn(30);
        $("#terminal").keydown(function(event) {
            if (event.keyCode == 13) {
                NLPTracker(createLink(getInput()));
            }
        });
    });
