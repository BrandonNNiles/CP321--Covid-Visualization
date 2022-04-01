
//Configurables
const width = 1000;
const height = 1000;
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv';
const naDataPath = '/data/covid_south_america_weekly_trend.csv';
const proj_scale = 140; //scale of projection

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

const svg = d3.select('#Task').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'tasksvg')

const proj = d3.geoMercator().scale(proj_scale);
const path = d3.geoPath(proj);

/*drawViz(geo, stats, cont_mode)
Draws our visualization
    geo: geojson data
    stats: array of csv data
    cont_mode: integer representation of continents to display, see enums
*/
let drawViz = (geo, stats, cont_mode) => {
    const g = svg.append('g')
    const chorog = g.append('g')
        .attr('id', 'chorog')
        .attr('transform', 'translate(0, 200)');

    chorog.selectAll('path')
        .data(geo.features)
        .enter()
        .append('path')
        .filter(function(d) { //Filtering continents
            if (cont_mode != ALL) {return d.properties.continent == modes[cont_mode]}
            return d;
        })
        .attr('class', 'country')
        .attr('d', path)
}

//Load and parse data
d3.json(geoDataPath).then((data, error) => {
    if(error){console.log(error); return;} 
    geoData = data
    d3.csv(saDataPath).then(data, error => {
        if(error){console.log(error); return;}
        sa_data = data
        d3.csv(naDataPath).then(data, error => {
            if(error){console.log(error); return;}
            na_data = data
        })
    })
    drawViz(geoData, {na_data, sa_data}, 2)
})

/* processclick(element)
Handles when radiobuttons are clicked
    element: DOM element that has been clicked
*/
function processClick(element){
    d3.select('#chorog').remove()
    drawViz(geoData, {na_data, sa_data}, element.value)
}