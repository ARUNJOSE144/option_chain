var spot_price = ""
var SELECTED_TOTAL_CALLS = []
var SELECTED_TOTAL_PUTS = []
var SELECTED_TOTAL_TIME = []
var SELECTED_STRIKE = []
var DISPLACEMENT_FROM_STRIKE = 4
var pollInterval = 40
var loadingTime = 10
var LOT_SIZE = 25
var AVERAGE_COUNT = 5
var audio = new Audio('https://www.soundjay.com/buttons/sounds/button-20.mp3');
audio.play();


getSelectedStrikes()

setInterval(function () {
    console.log("----Polling----")
    clickOntheRefreshIcon();
}, pollInterval * 1000);

clickOntheRefreshIcon();

function clickOntheRefreshIcon() {
    $(".refreshIcon")[0].click();
    const myTimeout = setTimeout(readDataFromOptionChain, loadingTime * 1000);
}

function readDataFromOptionChain() {

    spot_price = parseFloat(formatNumber($("#equity_underlyingVal")[0].textContent.split(" ")[1]))
    var optionChain = $("#optionChainTable-indices")[0].children[1];
    var total_Call = 0
    var total_put = 0

    for (var i = 0; i < optionChain.children.length; i++) {
        var row = optionChain.children[i];
        var strikePrice = parseFloat(formatNumber(row.children[11].textContent))
        if (SELECTED_STRIKE.includes(strikePrice)) {
            total_Call = total_Call + parseInt(formatNumber(row.children[1].textContent));
            total_put = total_put + parseInt(formatNumber(row.children[21].textContent));
            //console.log("call : " + formatNumber(row.children[1].textContent))
            //console.log("put : " + formatNumber(row.children[21].textContent))

        }

    }
    if (SELECTED_TOTAL_CALLS[SELECTED_TOTAL_CALLS.length - 1] != total_Call && SELECTED_TOTAL_PUTS[SELECTED_TOTAL_PUTS.length - 1] != total_put) {
        SELECTED_TOTAL_CALLS.push(total_Call)
        SELECTED_TOTAL_PUTS.push(total_put)
        var dd = new Date();
        SELECTED_TOTAL_TIME.push(dd.getHours() + ":" + dd.getMinutes() + ":" + dd.getSeconds())
        //console.log("SELECTED_TOTAL_CALLS :", SELECTED_TOTAL_CALLS)
        //console.log("SELECTED_TOTAL_PUTS :", SELECTED_TOTAL_PUTS)
        processResult()
    }
}

function processResult() {
    var RESULT = []
    for (var i = 0; i < SELECTED_TOTAL_CALLS.length; i++) {
        var obj = {}
        obj.call = alignNumber(SELECTED_TOTAL_CALLS[i])
        obj.put = alignNumber(SELECTED_TOTAL_PUTS[i])
        //obj.diff = (SELECTED_TOTAL_PUTS[i] - SELECTED_TOTAL_CALLS[i])
        obj.time = SELECTED_TOTAL_TIME[i]
        RESULT.push(obj)
    }

    //Averaging Diff
   /*  for (i = 0; i < RESULT.length; i++) {
        if (i >= AVERAGE_COUNT - 1) {
            var total = 0
            for (j = i; j >= i - (AVERAGE_COUNT - 1); j--) {
                total += RESULT[j].diff
            }
            RESULT[i].avg = total / AVERAGE_COUNT
        } 
    }*/
    console.log("SELECTED_STRIKE :", SELECTED_STRIKE)
    console.log("RESULT : ")
    console.table(RESULT)
    audio.play();
    console.log(JSON.stringify(RESULT))
}


function getSelectedStrikes() {
    spot_price = parseFloat(formatNumber($("#equity_underlyingVal")[0].textContent.split(" ")[1]))
    var optionChain = $("#optionChainTable-indices")[0].children[1];
    var refresh = []
    for (var i = 0; i < optionChain.children.length; i++) {
        var row = optionChain.children[i];
        var strikeDetails = {}
        var call = {};
        var strikePrice = parseFloat(formatNumber(row.children[11].textContent))
        if (strikePrice > spot_price) {
            for (var j = i - DISPLACEMENT_FROM_STRIKE; j < i + DISPLACEMENT_FROM_STRIKE; j++) {
                var row_strike = optionChain.children[j];
                SELECTED_STRIKE.push(parseFloat(formatNumber(row_strike.children[11].textContent)))
            }
            break;
        }

    }
    console.log("SELECTED_STRIKE :", SELECTED_STRIKE)
}

function formatNumber(data) {
    data = data.replaceAll(",", "");
    return data;
}


function alignNumber(x) {
    var res = "";
    if (validate(x)) {
        x = parseFloat(x).toFixed(0)
        x = x.toString();
        var lastThree = x.substring(x.length - 3);
        var otherNumbers = x.substring(0, x.length - 3);
        if (otherNumbers != '')
            lastThree = ',' + lastThree;
        res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    }
    return res;

}


function getObject(list, name, value) {
    if (validate(list)) {
        for (let index = 0; index < list.length; index++) {
            if (list[index][name] == value) {
                return list[index];
            }
        }
    }
}


function validate(value) {
    if (value != null && value != undefined && value != "") {
        return true;
    } else {
        return false;
    }
}