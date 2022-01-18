const margin = {top: 40, right: 10, bottom: 50, left: 80}
const chartWidth = 600;
const chartHeight = 600;
const innerWidth = chartWidth - margin.left - margin.right;
const innerHeight = chartHeight - margin.top - margin.bottom;

const CHART_VALUE_BUFFER = 5;

const DISJUNCTIVE_DIST_LOWER_BOUND = -9;
const DISJUNCTIVE_SPEED_UPPER_BOUND = 8;
const CONJUCTIVE_DIST_LOWER_BOUND = -5;
const CONJUNCTIVE_SPEED_UPPER_BOUND = 5;

const REACHABLE_SET_LINE_THICKNESS = .5;

const X_ATTR = "e1";
const Y_ATTR = "e1dot";
const DIST_ATTR = "initDist";
const ACCEL_ATTR = "initAccel";
const TIME_ATTR = "time";

// TODO flip X axis
const X_LABEL = "Following-distance error (meters)";
const X_LABEL_HORIZ_OFFSET = -120;
const X_LABEL_VERT_OFFSET = 40;
const Y_LABEL = "Speed towards front car (meters/second)";
const Y_LABEL_HORIZ_OFFSET = -35;
const Y_LABEL_VERT_OFFSET = -140;

const X_MAX = 10;
const X_MIN = -10;
const Y_MAX = 10;
const Y_MIN = -10;

let chartSvg;
let chartG;

let distInput;
let accelInput;
let timeInput;
let intermediateCheckbox;

let currentDist;
let currentAccel;
let currentTime;
let showIntermediateOutcomes;

let xScale = d3.scaleLinear().range([0, innerWidth]);
let yScale = d3.scaleLinear().range([innerHeight, 0]);

let dataForCurrentAcceleration;

d3.csv("data/data0.csv").then(data => {
    // TODO remove duplicate data points (if that is something that happens)
    dataForCurrentAcceleration = data;

    distInput = d3.select("#init-d-input");
    accelInput = d3.select("#init-a-input");
    timeInput = d3.select("#final-t-input");
    intermediateCheckbox = d3.select("#intermediate-checkbox");

    currentDist = distInput.node().value;
    currentAccel = accelInput.node().value;
    currentTime = timeInput.node().value;
    showIntermediateOutcomes = intermediateCheckbox.property("checked");

    chartSvg = d3.select("#chart")
        .attr("width", chartWidth)
        .attr("height", chartHeight);
    chartG = chartSvg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    distInput.node().addEventListener("input", updateDistance);
    accelInput.node().addEventListener("input", updateAcceleration);
    timeInput.node().addEventListener("input", updateTime);
    intermediateCheckbox.node().addEventListener("change", updateIntermediateShowage)
    
    drawChart();
});

function drawUnsafeSets() {
    let unsafeSets = document.getElementsByClassName("unsafe-set");
    while (unsafeSets[0]) unsafeSets[0].remove();

    if (X_MIN < DISJUNCTIVE_DIST_LOWER_BOUND) {
        let rightX = xScale(X_MIN);
        let leftX = xScale(DISJUNCTIVE_DIST_LOWER_BOUND);
        let bottomY = yScale(Y_MIN);
        let topY = yScale(Y_MAX);
        chartG.append("rect")
            .attr("class", "unsafe-set")
            .attr("x", leftX)
            .attr("y", topY)
            .attr("width", rightX - leftX)
            .attr("height", bottomY - topY);
    }
    if (Y_MAX > DISJUNCTIVE_SPEED_UPPER_BOUND) {
        let rightX = xScale(X_MIN);
        let leftX = xScale(X_MAX);
        let bottomY = yScale(DISJUNCTIVE_SPEED_UPPER_BOUND);
        let topY = yScale(Y_MAX);
        chartG.append("rect")
            .attr("class", "unsafe-set")
            .attr("x", leftX)
            .attr("y", topY)
            .attr("width", rightX - leftX)
            .attr("height", bottomY - topY);
    }

    if (X_MIN < CONJUCTIVE_DIST_LOWER_BOUND && Y_MAX > CONJUNCTIVE_SPEED_UPPER_BOUND) {
        let rightX = xScale(X_MIN);
        let leftX = xScale(CONJUCTIVE_DIST_LOWER_BOUND);
        let bottomY = yScale(CONJUNCTIVE_SPEED_UPPER_BOUND);
        let topY = yScale(Y_MAX);
        chartG.append("rect")
            .attr("class", "unsafe-set")
            .attr("x", leftX)
            .attr("y", topY)
            .attr("width", rightX - leftX)
            .attr("height", bottomY - topY);
    }
}

function drawChart() {
    let currentData = dataForCurrentAcceleration.filter(d => {
        return d[DIST_ATTR] === currentDist
            && (showIntermediateOutcomes ? +d[TIME_ATTR] <= +currentTime : +d[TIME_ATTR] === +currentTime);
    }).map(d => {
        let o = {};
        o[X_ATTR] = +d[X_ATTR];
        o[Y_ATTR] = -d[Y_ATTR];
        o[TIME_ATTR] = d[TIME_ATTR];
        return o;
    });

    // let xMin = Math.max(-10, d3.min(currentData, d => d[X_ATTR]) - CHART_VALUE_BUFFER);
    // let X_MAX = d3.max(currentData, d => d[X_ATTR]) + CHART_VALUE_BUFFER;
    xScale.domain([X_MAX, X_MIN]);

    // let yMin = d3.min(currentData, d => d[Y_ATTR]) - CHART_VALUE_BUFFER;
    // let yMax = d3.max(currentData, d => d[Y_ATTR]) + CHART_VALUE_BUFFER;
    yScale.domain([Y_MIN, Y_MAX]);

    drawUnsafeSets();

    drawCrosses();

    let timeDataMap = {};
    for (datum of currentData) {
        if (timeDataMap.hasOwnProperty(datum[TIME_ATTR])) {
            timeDataMap[datum[TIME_ATTR]].push(datum);
        }
        else {
            timeDataMap[datum[TIME_ATTR]] = [datum];
        }
    }

    currentData = [];
    for (time in timeDataMap) {
        currentData.push(timeDataMap[time]);
    }

    chartG.select('.axis').remove();
    chartG.select('.axis').remove();

    chartG.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));
    
    chartG.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));
        
    appendLabels();
    
    let plotLines = document.getElementsByClassName("plot-line");
    while (plotLines[0]) plotLines[0].remove();

    for (let reachSetData of currentData) {
        chartG.append("path")
            .datum(reachSetData)
            .attr("class", "plot-line")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", REACHABLE_SET_LINE_THICKNESS)
            .attr("d", d3.line()
                            .defined(d => d[X_ATTR] > X_MIN)
                            .x(d => xScale(d[X_ATTR]))
                            .y(d => yScale(d[Y_ATTR]))
                );
    }
}

function drawCrosses() {
    chartG.select(".cross").remove();
    chartG.select(".cross").remove();

    chartG.append("path")
        .attr("class", "cross")
        .attr("id", "ideal-cross")
        .attr("transform", `translate(${xScale(0)}, ${yScale(0)})`)
        .attr("d", d3.symbol(d3.symbolCross, 80));

    chartG.append("path")
        .attr("class", "cross")
        .attr("id", "init-cross")
        .attr("transform", `translate(${xScale(currentDist)}, ${yScale(0)})`)
        .attr("d", d3.symbol(d3.symbolCircle, 120));
}

function appendLabels() {
    chartG.select('.axis-label').remove();
    chartG.select('.axis-label').remove();

    chartG.append('text')
        .attr('class', 'axis-label')
        .attr('x', (innerWidth / 2) + X_LABEL_HORIZ_OFFSET)
        .attr('y', innerHeight + X_LABEL_VERT_OFFSET)
        .text(X_LABEL);
    
    chartG.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(innerHeight / 2) + Y_LABEL_VERT_OFFSET)
        .attr('y', Y_LABEL_HORIZ_OFFSET)
        .text(Y_LABEL);
}

function updateDistance() {
    currentDist = distInput.node().value;
    drawChart();
}

function updateAcceleration() {
    currentAccel = accelInput.node().value;
    accelInput.attr("disabled", "disabled");
    let fileToLoad;
    fileToLoad = `data/data${currentAccel}.csv`;
    d3.csv(fileToLoad).then(data => {
        dataForCurrentAcceleration = data;
        drawChart();
        accelInput.attr("disabled", null);
    });
}

function updateTime() {
    currentTime = timeInput.node().value;
    drawChart();
}

function updateIntermediateShowage() {
    showIntermediateOutcomes = intermediateCheckbox.property("checked");
    drawChart();
}
