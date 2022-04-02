
//Configurables
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv';
const naDataPath = '/data/north_america_covid_weekly_trend.csv';
const proj_scale = 245; //scale of projection
const def_trans = [900, 710] //default translation
const zoom_range = [1, 42] // range of zoom of map

    //SVGs
const svgpadding = [10, 10]
const width = screen.width / 4 - svgpadding[0];
const height = screen.width / 3 - svgpadding[1];

    //Total cases box:
const box_pos = [5,5] //top left
const box_text_padding = [5, 5]
const box_font_size = 20
    //Country selection:
const selected_colour = 'white' //should be distinct from choro

//ENUMS
const NORTH_AMERICA = 0;
const SOUTH_AMERICA = 1;
const ALL = 2;
const modes = {
    0: "North America",
    1: "South America"
}

let geoData
let na_data
let sa_data

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

const g = svg.append('g').attr('id', 'g')

const proj = d3.geoMercator()
                .scale(proj_scale)
                .translate(def_trans)
const path = d3.geoPath(proj);

/*drawViz(geo, stats, cont_mode)
Draws our visualization
    geo: geojson data
    stats: array of csv data
    cont_mode: integer representation of continents to display, see enums
*/
let drawViz = (geo, stats, cont_mode) => {
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
        .attr('fill', 'purple') //set colour with choro
        .attr('prev_colour', 'purple') //store same colour here to restore it when unselected

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

//Load and parse data

/*
    TO DO: FIX LOADING ORDER TO PREVENT ERRORS
*/

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
    d3.select('#chorog').remove()
    d3.select('#absg').remove()
    drawViz(geoData, {na_data, sa_data}, element.value)
}

/* selectCountry(element)
Handles when a country is selected (clicked)
    element: DOM element that has been clicked
*/
let selected_country
function selectCountry(element){
    if (selected_country != null){
        selected_country.setAttribute('fill', selected_country.getAttribute('prev_colour'))
    }

    element.setAttribute('fill', selected_colour)
    selected_country = element

    //todo: zoom on country select
    //https://observablehq.com/@d3/zoom-to-bounding-box //MID STAGE
    //button to refocus on selected country? LATE STAGE
    //search bar to select country? LATE STAGE

}

//zoom/pan handling
var zoom = d3.zoom()
    .scaleExtent(zoom_range)
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', function(e) {
        g.select('g').attr('transform', e.transform);
});
svg.call(zoom);
