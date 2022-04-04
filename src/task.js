
//Configurables
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv';
const naDataPath = '/data/north_america_covid_weekly_trend.csv';
const proj_scale = 200; //scale of projection
const def_trans = [660, 600]; //default translation
const zoom_range = [1, 42]; // range of zoom of map
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
const selected_colour = 'white'; //should be distinct from choro

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
const TOP5 = 2;
let choromode = INCREASE;

let selected_country;

//SCALES
var incScale = d3.scaleQuantize()
    .domain([0,60000])
    .range(["#FF0D0D", "#FF4E11", "#FF8E15"]);
var decScale = d3.scaleQuantize()
    .domain([0,-5000])
    .range(["#FAB733", "#ACB334", "#69B34C"]);
var absScale = d3.scaleLinear()
    //.domain([0, Math.max(d3.max(sa_data, function(d) {return d[1]}), na_data)])
    .domain([0, 800000]) //find max domain with code!
    .range(["white", "red"]);


//GLOBALS

const globalsvg = d3.select('#TaskMain').append('svg')
    .attr('class', 'tripsvg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'globalsvg');

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
    if(selected_country != null && data.properties.name == selected_country.getAttribute('name')){
        return selected_colour;
    }
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
            if(diff > 0){
                return incScale(diff)
            }
            return decScale(diff);
            break;
        case ABSO:
            //I wrote 'cases...' alot, -> constant please TODO
            return absScale(obj['Cases in the last 7 days'])
            break;
        case TOP5:
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
    sa_data.forEach(function(d) {
        d['Cases in the last 7 days'] = +d['Cases in the last 7 days'] ;
    });
    na_data.forEach(function(d) {
        d['Cases in the last 7 days'] = +d['Cases in the last 7 days'] ;
    });
    d3.select('#chorog').remove()
    d3.select('#absg').remove()
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
        .attr('onclick', 'selectCountry(this)')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => processColour(d)) //set colour with choro
        .attr('prev_colour', d => processColour(d)) //store same colour here to restore it when unselected

    //Draw absoloute cases

    let totalcases = 0 //count total cases
    if(cont_mode != NORTH_AMERICA){ // do SA
        sa_data.forEach(function(item, index){
            totalcases += parseInt(item['Cases in the last 7 days'])
        });
    }
    if(cont_mode != SOUTH_AMERICA){ // do NA
        na_data.forEach(function(item, index){
            totalcases += parseInt(item['Cases in the last 7 days'])
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
    
}

function drawExampleWorld(){

    const bar_dims = [300, 300]
    const pie_dims = [300, 300]

    const bars = globalsvg.append('g')
    bars.append('rect')
        .attr('width', bar_dims[0])
        .attr('height', bar_dims[1])
        .attr('x', (width / 2) - (bar_dims[0] / 2))
        .attr('y', (height / 4) - (bar_dims[1] / 2))
        .attr('fill', 'black')
        .attr('id', 'barchart')

    const pie_top = globalsvg.append('g')
    pie_top.append('rect')
        .attr('width', pie_dims[0])
        .attr('height', pie_dims[1])
        .attr('x', (width / 3.5) - (pie_dims[0] / 2))
        .attr('y', (height / 1.35) - (pie_dims[1] / 2))
        .attr('fill', 'black')
        .attr('id', 'pietop')
    const pie_bottom = globalsvg.append('g')
    pie_bottom.append('rect')
        .attr('width', pie_dims[0])
        .attr('height', pie_dims[1])
        .attr('x', (width / 1.4) - (pie_dims[0] / 2))
        .attr('y', (height / 1.35) - (pie_dims[1] / 2))
        .attr('fill', 'black')
        .attr('id', 'piebottom')
    
    const heading1 = globalsvg.append('text')
        .text("Absoloute Cases")
        .attr('x', width / 2)
        .attr('y', 50)
        .attr("text-anchor", "middle")
        .attr('text-align', 'center')
    const heading2 = globalsvg.append('text')
        .text("Top 5 and Bottom 5 Countries")
        .attr('x', width / 2)
        .attr('y', 450)
        .attr("text-anchor", "middle")
        .attr('text-align', 'center')

}
drawExampleWorld()

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
    
    if(selected_country != null){return;} //We don't want to draw anything after label
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
    if (selected_country != null){
        selected_country.setAttribute('fill', selected_country.getAttribute('prev_colour'))
    }

    //FIX COLOUR SELECTION WHEN SWAPPING REGIONS


    element.setAttribute('fill', selected_colour)
    selected_country = element
    drawCountryInfo()

    //todo: zoom on country select
    //https://observablehq.com/@d3/zoom-to-bounding-box //MID STAGE
    //button to refocus on selected country? LATE STAGE
    //search bar to select country? LATE STAGE

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
