
//Configurables
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv';
const naDataPath = '/data/north_america_covid_weekly_trend.csv';
const proj_scale = 200; //scale of projection
const def_trans = [660, 600]; //default translation
const zoom_range = [1, 48]; // range of zoom of map
const country_header_label = "Selected country: ";

    //SVGs
const svgpadding = [10, 10];
const width = screen.width  * 0.9 / 3 - svgpadding[0];
const height = screen.width / 3 - svgpadding[1];

    //Total cases box:
const box_pos = [5,5]; //top left
const box_text_padding = [5, 5];
const box_font_size = 20;
    //Country selection:
const selected_colour = 'black'; //should be distinct from choro

let geoData;
let na_data;
let sa_data;

//ENUMS
const NORTH_AMERICA = 0;
const SOUTH_AMERICA = 1;
const ALL = 2;

const modes = {
    0: "North America",
    1: "South America"
};
let cont_select = ALL;

const INCREASE = 0;
const ABSO = 1;
const ABSB = 3;
const TOP5 = 2;
let choromode = INCREASE;

let selected_country;

//SCALES
var incScale = d3.scaleLinear()
    .domain([-60000, -50, 0, 50, 5000]) //again find better domain calcs
    .range(["#90EF90", "#CDFFCC", "#FFFFFF", "#FFCCCB", "#FC6C85"]);

var absScale = d3.scaleLinear()
    //.domain([0, Math.max(d3.max(sa_data, function(d) {return d[1]}), na_data)])
    .domain([0, 800000]) //find max domain with code!
    .range(["white", "red"]);


//GLOBALS

let topcountries = new Array();
let bottomcountries = new Array()
/*
const globalsvg = d3.select('#TaskMain').append('svg')
    .attr('class', 'tripsvg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'globalsvg');

    */
const svg = d3.select('#TaskMain').append('svg')
    .attr('class', 'tripsvg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'tasksvg');
const countrysvg = d3.select('#TaskMain').append('svg')
    .attr('class', 'tripsvg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'countrysvg');

const g = svg.append('g').attr('id', 'g');

const proj = d3.geoMercator()
                .scale(proj_scale)
                .translate(def_trans);
const path = d3.geoPath(proj);

/* processColour(data)
Returns what colour a data point should be
    data: datapoint object
*/
function processColour(data){
    let dataset;
    if(data.properties.continent == "North America"){
        dataset = na_data;
    } else if (data.properties.continent == "South America"){
        dataset = sa_data;
    } else {
        return 'black' //in the case the country doesn't actually exist in data
    }
    let obj = dataset.find(d => d['Country/Other'] === data.properties.name) //geojson -> csv find
    switch(choromode){
        case INCREASE:
            let diff = parseInt(obj['Cases in the last 7 days']) - parseInt(obj['Cases in the preceding 7 days'])
            return incScale(diff);
            break;
        case ABSO:
            //I wrote 'cases...' alot, -> constant please TODO
            return absScale(obj['Cases in the last 7 days'])
            break;
        case ABSB:
            return absScale(obj['Cases in the preceding 7 days'])
            break;
        case TOP5:
            if(topcountries.includes(obj[['Country/Other']])){
                return 'green';
            }
            if(bottomcountries.includes(obj[['Country/Other']])){
                return 'red'
            }
            return 'white'
            break;
        default:
            return 'white' //this should never happen
    }
}


/*drawViz(geo, stats, cont_mode)
Draws our visualization
    geo: geojson data
    stats: array of csv data
    cont_mode: integer representation of continents to display, see enums
*/
let drawViz = (geo, stats, cont_mode) => {
    //top5/bottom5 calc
    var top = new Array();
    sa_data.forEach(function(item, index){
        top.push([item['Country/Other'], parseInt(item['Cases in the last 7 days/1M pop'])])
    })
    na_data.forEach(function(item, index){
        top.push([item['Country/Other'], parseInt(item['Cases in the last 7 days/1M pop'])])
    })
    top.sort(function(a,b){
        if(a[1] > b[1]){
            return 1;
        }
        if(a[1] < b[1]){
            return -1;
        }
        return 0
    })
    for(i = 0; i < 5; i++){
        bottomcountries[i] = top[top.length - i - 1][0]
        topcountries[i] = top[i][0]
    }

    d3.select('#chorog').remove()
    d3.select('#absg').remove()
    d3.select('#titleg').remove()
    const chorog = g.append('g')
        .attr('id', 'chorog')

    chorog.selectAll('path') //draw countries
        .data(geo.features)
        .enter()
        .append('path')
        .filter(function(d) { //Filtering continents
            if (cont_mode != ALL) {return d.properties.continent == modes[cont_mode]}
            return d;
        })
        .attr('name', d => d.properties.name)
        .attr('continent', d => d.properties.continent)
        .attr('onclick', 'selectCountry(this)')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
            if(selected_country != null && d.properties.name == selected_country.getAttribute('name')){
                return selected_colour;
            }
            return processColour(d)
        }) //set colour with choro
        .attr('prev_colour', d => processColour(d)) //store same colour here to restore it when unselected

    //Draw absoloute cases

    let totalcases = 0 //count total cases
    let total_term;
    if(choromode == ABSB){
        total_term = 'Cases in the preceding 7 days';
    } else {
        total_term = 'Cases in the last 7 days';
    }
    if(cont_mode != NORTH_AMERICA){ // do SA
        sa_data.forEach(function(item, index){
            totalcases += parseInt(item[total_term])
        });
    }
    if(cont_mode != SOUTH_AMERICA){ // do NA
        na_data.forEach(function(item, index){
            totalcases += parseInt(item[total_term])
        });
    }


    const absg = g.append('svg')
        .attr('id', 'absg')
    const box_string = 'Total cases: ' + totalcases
    
    const casestext = absg.append('text')
    .text(box_string)
    .attr('id', 'box-text')
    .attr('x', box_pos[0] + box_text_padding[0])
    .attr('y', box_pos[1] + box_font_size + (box_text_padding[1] / 2))
    .attr('font-size', box_font_size)
    var ctx = document.getElementById("absg"),
    textElm = ctx.getElementById("box-text"),
    SVGRect = textElm.getBBox();
    
    const casesbox = absg.append('rect')
        .attr('id', 'casebox')
        .attr('x', box_pos[0])
        .attr('y', box_pos[1])
        .attr('width', SVGRect.width + (box_text_padding[0] * 2))
        .attr('height', box_font_size + (box_text_padding[1] * 2))
    ctx.insertBefore(ctx.getElementById('casebox'), textElm);

    //map legend /title
    let myScale;
    let maptitle

    switch (choromode){
        case(INCREASE):
            myScale = incScale
            maptitle = "# of Case Changes From Previous Week"
            break;
        case(ABSO):
            maptitle = "Absoloute Cases"
            myScale = absScale
            break;
        case(ABSB):
            maptitle = "Absoloute Cases (Previous week)"
            myScale = absScale
            break;
        case(TOP5):
            maptitle = "Top 5/Bottom 5 (cases per 1M people)"
            break;
    }
    if (choromode != TOP5){
        drawLegend2('#tasksvg', width * 0.93, height * 0.8, myScale, 'Legend', 'maplegend')
    } else{
        drawLegendTop('#tasksvg', width * 0.93, height * 0.8, myScale, 'Legend', 'maplegend')
    }

    const titleg = g.append('svg')
        .attr('id', 'titleg')
    
    const titletext = titleg.append('text')
    .text(maptitle)
        .attr('text-align', 'center')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', 35)
        .attr('id', 'maptitle')
        .attr('font-size', '1.2em')
    var atx = document.getElementById("titleg"),
    textElme = atx.getElementById("maptitle"),
    SVGRect2 = textElme.getBBox();
    
    const titlebox = titleg.append('rect')
        .attr('id', 'titlebox')
        .attr('x', (width / 2) - SVGRect2.width / 2 - box_text_padding[0])
        .attr('y', box_pos[1] + 7)
        .attr('width', SVGRect2.width + (box_text_padding[0] * 2))
        .attr('height', box_font_size + (box_text_padding[1] * 2))
        .attr('fill', 'white')
        .attr('stroke', 'black')
    atx.insertBefore(atx.getElementById('titlebox'), textElme);
}

// function drawExampleWorld(){

//     const bar_dims = [300, 300]
//     const pie_dims = [300, 300]

//     const bars = globalsvg.append('g')
//     bars.append('rect')
//         .attr('width', bar_dims[0])
//         .attr('height', bar_dims[1])
//         .attr('x', (width / 2) - (bar_dims[0] / 2))
//         .attr('y', (height / 4) - (bar_dims[1] / 2))
//         .attr('fill', 'black')
//         .attr('id', 'barchart')

//     const pie_top = globalsvg.append('g')
//     pie_top.append('rect')
//         .attr('width', pie_dims[0])
//         .attr('height', pie_dims[1])
//         .attr('x', (width / 3.5) - (pie_dims[0] / 2))
//         .attr('y', (height / 1.35) - (pie_dims[1] / 2))
//         .attr('fill', 'black')
//         .attr('id', 'pietop')
//     const pie_bottom = globalsvg.append('g')
//     pie_bottom.append('rect')
//         .attr('width', pie_dims[0])
//         .attr('height', pie_dims[1])
//         .attr('x', (width / 1.4) - (pie_dims[0] / 2))
//         .attr('y', (height / 1.35) - (pie_dims[1] / 2))
//         .attr('fill', 'black')
//         .attr('id', 'piebottom')
    
//     const heading1 = globalsvg.append('text')
//         .text("Absoloute Cases")
//         .attr('x', width / 2)
//         .attr('y', 50)
//         .attr("text-anchor", "middle")
//         .attr('text-align', 'center')
//     const heading2 = globalsvg.append('text')
//         .text("Top 5 and Bottom 5 Countries")
//         .attr('x', width / 2)
//         .attr('y', 450)
//         .attr("text-anchor", "middle")
//         .attr('text-align', 'center')

// }
// drawExampleWorld()

/*drawCountryInfo()
Draws specialized visulization and data for a selected country.
*/
function drawCountryInfo(){
    let header_text = country_header_label
    d3.select('#country_g').remove() //Remove if exists for redraw
    
    if(selected_country == null){
        header_text += "None"
    } else {
        header_text += selected_country.getAttribute('name')
    }
    
    const cg = countrysvg.append('g')
        .attr('id', 'country_g')
    
    const header = cg.append('text')
        .text(header_text)
        .attr('id', 'country_header')
        .attr('x', 10)
        .attr('y', 50)
    
    if(selected_country == null){return;} //We don't want to draw anything after label

    //Draw barchart
    //cases (%change) deaths (%change)
    let dataset;
    continent = selected_country.getAttribute('continent')
    if(continent == "North America"){
        dataset = na_data;
    } else if (continent == "South America"){
        dataset = sa_data;
    }
    let obj = dataset.find(d => d['Country/Other'] === selected_country.getAttribute('name')) //geojson -> csv find
    drawBarChart('Cases and Deaths', 'country_g', 'Statistic', '# of people', 350, 350, obj )
    //cases vs deaths /1m
}
drawCountryInfo()

//Load and parse data

d3.csv(saDataPath).then((data, error) => {
    if(error){console.log(error); return;}
    sa_data = data
})

d3.csv(naDataPath).then((data, error) => {
    if(error){console.log(error); return;}
    na_data = data
})

d3.json(geoDataPath).then((data, error) => {
    if(error){console.log(error); return;} 
    geoData = data 
    drawViz(geoData, {na_data, sa_data}, 2)
})

/* processclick(element)
Handles when radiobuttons are clicked
    element: DOM element that has been clicked
*/
function processClick(element){
    //to do: zoom when mode is changed //MID STAGE
    if(element.getAttribute('name') == 'cont_select'){
        cont_select = element.value
    } else if(element.getAttribute('name') == 'choro_select'){
        choromode = parseInt(element.value);
    }
    drawViz(geoData, {na_data, sa_data}, cont_select)
}

/* selectCountry(element)
Handles when a country is selected (clicked)
    element: DOM element that has been clicked
*/
function selectCountry(element){
    if(element == null){return;}
    if (selected_country != null){ //lengthy switch for swapping modes with selection
        d3.selectAll('path')
            .each(function (d, i){
                var path_name = d3.select(this).attr('name')
                if(path_name == selected_country.getAttribute('name')){
                    var curr_sel = d3.select(this)
                    curr_sel.attr('fill', curr_sel.attr('prev_colour'))
                }
            })
    }

    element.setAttribute('fill', selected_colour)
    selected_country = element
    drawCountryInfo() //call to update

    //todo: zoom on country select
    //https://observablehq.com/@d3/zoom-to-bounding-box //MID STAGE
    //button to refocus on selected country? LATE STAGE
}

/* removeSelection()
Unselects the currently selected country.
Meant to be used with a button.
*/
function removeSelection(){
    selected_country = null;
    drawCountryInfo()
    drawViz(geoData, {na_data, sa_data}, cont_select)
}

//zoom/pan handling
var zoom = d3.zoom()
    .scaleExtent(zoom_range)
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', function(e) {
        g.select('g').attr('transform', e.transform);
});
svg.call(zoom);

let legendCircleR = 5;
let legendEntrySpacing = 20;

function drawLegend2(canvas, posx, posy, scale, legendTitle, id){
    d3.select("." + id).remove()
    var legend  = d3.select(canvas).append('g').attr('class', id);

    legend.append('rect')
        .attr('y', - 17)
        .attr('x', -40)
        .attr('width', 80)
        .attr('height', 150) //we could dynamically resize but time constraints
        .attr('fill', 'white')
        .attr('stroke', 'black')
    
    legend.append('text') //Legend title
    .attr("text-anchor", "middle")
    .attr('text-align', 'center')
    .style('padding', "-20 -20 -20 -20")
    .style('font-size', '1em')
    .attr('x', 0)
    .attr('y', 0)
    .text(legendTitle);

    let ind;
    let domain = scale.domain()

    var gradcol = [scale.range()[0], scale.range()[scale.range().length - 1] ];
    if(scale.range().length == 5){
        gradcol.push(scale.range()[2])
        let temp = gradcol[2]
        gradcol[2] = gradcol[1]
        gradcol[1] = temp

    }
    var gradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'grad')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    
    gradient.selectAll('stop')
      .data(gradcol)
      .enter()
      .append('stop')
      .style('stop-color', function(d){ return d; })
      .attr('offset', function(d,i){
        return 100 * (i / (gradcol.length - 1)) + '%';
      })
    
    legend.append('rect')
      .attr('x', -30)
      .attr('y', 15)
      .attr('width', 20)
      .attr('height', 85)
      .style('fill', 'url(#grad)');

    if (domain.length == 2){
        domain.push((domain[0] + domain[1]) / 2)
        domain.sort()
    }
    /*
    domain.forEach(function (value, index){
        addEntry(scale(value), 1, value, index + 1, 0)
        ind = index + 2.2;
    })
    */
   ind = 6
    addEntry('black', 1, 'Selected', ind, -15)


    function addEntry(color, opacity, value, num, offset){
        var box = legend.append('g');
        box.append("circle")
            .attr("r", legendCircleR)
            .attr("cx", -1.5 * legendCircleR)
            .attr("cy", -legendCircleR / 2 - 1)
            .style("fill", color)
            .attr("opacity", opacity)
            .style("stroke", "black");

        box.append("text")
            .attr("text-anchor", "left")
            .attr('text-align', 'left')
            .style('padding', "-20 -20 -20 -20")
            .style('font-size', '0.7em')
            .attr('x', 0)
            .attr('y', 0)
            .text(value);

        box.attr("transform", "translate("+ parseInt(-10 + offset) + ', ' + legendEntrySpacing * num +")");

    }
    addEntry('red', 0, domain[0],1, 5);
    if(domain.length > 2){
        addEntry('red', 0, domain[Math.floor(domain.length / 2)],3, 5);
    }
    addEntry('red', 0, domain[domain.length - 1],5, 5);
    legend.attr("transform", "translate("+posx + ','+posy+")");
}

function drawLegendTop(canvas, posx, posy, scale, legendTitle, id){ //slightly modified legend func
    d3.select("." + id).remove()
    var legend  = d3.select(canvas).append('g').attr('class', id);

    legend.append('rect')
        .attr('y', - 17)
        .attr('x', -40)
        .attr('width', 80)
        .attr('height', 150) //we could dynamically resize but time constraints
        .attr('fill', 'white')
        .attr('stroke', 'black')
    
    legend.append('text') //Legend title
    .attr("text-anchor", "middle")
    .attr('text-align', 'center')
    .style('padding', "-20 -20 -20 -20")
    .style('font-size', '1em')
    .attr('x', 0)
    .attr('y', 0)
    .text(legendTitle);

    addEntry('black', 1, 'Selected', 6, -15)
    addEntry('green', 1, 'Lowest 5', 2, -3)
    addEntry('red', 1, 'Highest 5', 1, -3)
    addEntry('white', 1, 'Other', 3, -3)

    function addEntry(color, opacity, value, num, offset){
        var box = legend.append('g');
        box.append("circle")
            .attr("r", legendCircleR)
            .attr("cx", -1.5 * legendCircleR)
            .attr("cy", -legendCircleR / 2 - 1)
            .style("fill", color)
            .attr("opacity", opacity)
            .style("stroke", "black");

        box.append("text")
            .attr("text-anchor", "left")
            .attr('text-align', 'left')
            .style('padding', "-20 -20 -20 -20")
            .style('font-size', '0.7em')
            .attr('x', 0)
            .attr('y', 0)
            .text(value);

        box.attr("transform", "translate("+ parseInt(-10 + offset) + ', ' + legendEntrySpacing * num +")");

    }

    legend.attr("transform", "translate("+posx + ','+posy+")");
}

function drawBarChart(title, canvas, yAxisLabel, xAxisLabel, width, height, obj ){
    //Configurables
    const border = {left: 60, right: 20, bottom: 60, top: 50}; //Padding
    const labels = ['Cases in the preceding 7 days', 'Cases in the last 7 days',
        'Deaths in the preceding 7 days', 'Deaths in the last 7 days']
    const xAxisData1 = [obj[labels[0]], obj[labels[1]], obj[labels[2]], obj[labels[3]]]; //Data on the x axis
    const yAxisData1 = ['Cases', 'Deaths']; //Data on the y axis
    //Create 500x500 svg element
    const barchart = d3.select("#" + canvas)
        .append("svg")
        .classed('barchart', true)
        .style('border', '4px solid black')
        .style('width', String(width))
        .style('height', String(height))
        .attr('x', 50)
        .attr('y', 50)

    const usableWidth = width - (border.left + border.right);
    const usableHeight = height - (border.top + border.bottom);

    const g = barchart.append('g')
    .attr('transform', `translate(${border.left},${border.top})`); //Padding


    const xScale = d3.scaleLinear().domain([0, Math.max(parseInt(obj[labels[0]]) * 1.1, parseInt(obj[labels[1]]) * 1.1)]).range([0, usableWidth]); //scale calc
    const yScale = d3.scaleBand().domain(yAxisData1).range([0, usableHeight])
       // .padding(0.15);


    //Axis
    const xTick = number => d3.format('.2s')(number).replace('G', 'B');
    const xAxis = d3.axisBottom(xScale).tickFormat(xTick).tickSize(-usableHeight);

    g.append('g').call(d3.axisLeft(yScale));
    const xAxisG = g.append('g').call(xAxis)
    .attr('transform', `translate(0,${usableHeight})`);

    var i = 0;
    let new_h = yScale.bandwidth() / 4
    let perc_label = "% from previous week"
    
    g.append('rect')
        .attr('y', 60 - new_h)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[0]))
        .attr('class', 'last')
    g.append('rect')
        .attr('y', 60)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[1]))
        .attr('class', 'current')
    g.append('text')
        .attr('y', 60)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[1]))
        .attr('class', 'percent')
        .text(obj['Weekly Case % Change'] + perc_label)
    g.append('rect')
        .attr('y', 180 - new_h)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[2]))
        .attr('class', 'last')
    g.append('rect')
        .attr('y', 180)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[3]))
        .attr('class', 'current')
    g.append('text')
        .attr('y', 180)
        .attr('height', new_h)
        .attr('width', xScale(xAxisData1[1]))
        .attr('class', 'percent')
        .text(obj['Weekly Death % Change'] + perc_label)

    g.append('circle')
        .attr('cx', 300)
        .attr('cy', 100)
        .attr('r', 5)
        .attr('fill', 'red')
    g.append('text')
        .attr('x', 310)
        .attr('y', 105)
        .text("Previous Week")
        .attr('text-align', 'center')

     g.append('circle')
        .attr('cx', 300)
        .attr('cy', 125)
        .attr('r', 5)
        .attr('fill', 'green')
    g.append('text')
        .attr('x', 310)
        .attr('y', 130)
        .text("Last Week")
        .attr('text-align', 'center')
    
    
    barchart.append('text')
        .attr('class', 'title')
        .attr('y', 30)
        .attr('x', 28)
        .text(title);    
    g.append('text')
        .attr('class', 'axis-label')
        .attr('y', usableHeight + 30)
        .attr('x', usableWidth / 2)
        .attr("text-anchor", "middle")
        .text(xAxisLabel);
    barchart.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("y", 30)
        .attr("x", -usableHeight / 2 - 35)
        .attr("transform", "rotate(-90)")
        .text(yAxisLabel);
}